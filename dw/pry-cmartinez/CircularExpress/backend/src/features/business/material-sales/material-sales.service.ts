import { Transaction } from "sequelize";
import { NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { isValidDateOnly, todayInBusinessZone } from "../../../shared/utils/dates";
import { hasAtMostTwoDecimals, roundTo2 } from "../../../shared/utils/numbers";
import { parseIdFilter } from "../../../shared/validation/query-filters";
import { MaterialLotsRepository } from "../material-lots/material-lots.repository";
import { applyStockChange, StockEffect } from "../material-lots/material-lots.stock";
import { CreateMaterialSaleDto } from "./dto/create-material-sale.dto";
import { MaterialSaleResponseDto, toMaterialSaleResponse } from "./dto/material-sale-response.dto";
import { PatchMaterialSaleDto } from "./dto/patch-material-sale.dto";
import { MATERIAL_SALE_STATUSES, MaterialSale, MaterialSaleStatus } from "./material-sale.model";
import { MaterialSalesRepository } from "./material-sales.repository";

const TEXT_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 255;
const MAX_AMOUNT = 99_999_999.99; // DECIMAL(10, 2)
const MAX_TOTAL = 9_999_999_999.99; // DECIMAL(12, 2)

// The fields that decide the lot, the total and the stock effect after a write.
interface SaleState {
  materialLotId: number;
  quantityKg: number;
  unitPricePerKg: number;
  saleDate: string;
  status: MaterialSaleStatus;
}

// What a sale takes from a lot's stock: only active sales count (negative kg = removed).
const effectOf = (state: Pick<SaleState, "status" | "materialLotId" | "quantityKg">): StockEffect | null =>
  state.status === "active" ? { lotId: state.materialLotId, kg: -state.quantityKg } : null;

// Business rules for sales: server-computed total, active lot, no future dates, and keeping each lot's
// stock equal to its weighings minus its active sales (never below 0).
export class MaterialSalesService {
  constructor(
    private readonly repository: MaterialSalesRepository = new MaterialSalesRepository(),
    private readonly lotsRepository: MaterialLotsRepository = new MaterialLotsRepository()
  ) {}

  async findAll(materialLotIdFilter?: unknown): Promise<MaterialSaleResponseDto[]> {
    const sales = await this.repository.findAllActive(parseIdFilter(materialLotIdFilter, "materialLotId"));
    return sales.map(toMaterialSaleResponse);
  }

  async findOne(id: number): Promise<MaterialSaleResponseDto> {
    return toMaterialSaleResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<MaterialSaleResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateMaterialSaleDto;
    const state: SaleState = {
      materialLotId: dto.materialLotId,
      quantityKg: dto.quantityKg,
      unitPricePerKg: dto.unitPricePerKg,
      saleDate: dto.saleDate ?? todayInBusinessZone(),
      status: dto.status ?? "active",
    };
    const totalAmount = this.totalOf(state);
    return withTransaction(async (transaction) => {
      await this.ensureLot(state.materialLotId, null, transaction);
      // Update the lot BEFORE inserting the sale (same FK lock-ordering reason as weighings).
      await this.stock(null, effectOf(state), transaction);
      const sale = await this.repository.create(
        { ...state, name: dto.name, buyerName: dto.buyerName, description: dto.description ?? null, totalAmount },
        transaction
      );
      return this.reloadResponse(sale.id, transaction);
    });
  }

  async replace(id: number, input: unknown): Promise<MaterialSaleResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateMaterialSaleDto;
    return withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      const state: SaleState = {
        materialLotId: dto.materialLotId,
        quantityKg: dto.quantityKg,
        unitPricePerKg: dto.unitPricePerKg,
        saleDate: dto.saleDate ?? todayInBusinessZone(),
        status: dto.status ?? current.status,
      };
      const texts = { name: dto.name, buyerName: dto.buyerName, description: dto.description ?? null };
      return this.write(current, state, texts, transaction);
    });
  }

  async patch(id: number, input: unknown): Promise<MaterialSaleResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      const state: SaleState = {
        materialLotId: dto.materialLotId ?? current.materialLotId,
        quantityKg: dto.quantityKg ?? current.quantityKg,
        unitPricePerKg: dto.unitPricePerKg ?? current.unitPricePerKg,
        saleDate: dto.saleDate ?? current.saleDate,
        status: dto.status ?? current.status,
      };
      const texts = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.buyerName !== undefined && { buyerName: dto.buyerName }),
        ...(dto.description !== undefined && { description: dto.description }),
      };
      return this.write(current, state, texts, transaction);
    });
  }

  async deactivate(id: number): Promise<MaterialSaleResponseDto> {
    return withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      if (current.status === "inactive") return toMaterialSaleResponse(current);
      await this.stock(effectOf(current), null, transaction);
      await this.repository.update(current, { status: "inactive" }, transaction);
      return this.reloadResponse(id, transaction);
    });
  }

  async remove(id: number): Promise<void> {
    await withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      await this.stock(effectOf(current), null, transaction);
      await this.repository.delete(current, transaction);
    });
  }

  // Shared by PUT and PATCH: validates the resulting state, swaps the stock effect and saves.
  private async write(
    current: MaterialSale,
    state: SaleState,
    texts: { name?: string; buyerName?: string; description?: string | null },
    transaction: Transaction
  ): Promise<MaterialSaleResponseDto> {
    const totalAmount = this.totalOf(state);
    await this.ensureLot(state.materialLotId, current, transaction);
    await this.stock(effectOf(current), effectOf(state), transaction);
    await this.repository.update(current, { ...state, ...texts, totalAmount }, transaction);
    return this.reloadResponse(current.id, transaction);
  }

  private totalOf(state: SaleState): number {
    const total = roundTo2(state.quantityKg * state.unitPricePerKg);
    if (total > MAX_TOTAL) {
      throw new ValidationError(`El total de la venta supera el máximo permitido (${MAX_TOTAL})`, { totalAmount: total });
    }
    return total;
  }

  // A new or changed lot must exist and be active; an unchanged lot stays valid even if later deactivated.
  private async ensureLot(materialLotId: number, current: MaterialSale | null, transaction: Transaction): Promise<void> {
    if (current && current.materialLotId === materialLotId) return;
    const lot = await this.lotsRepository.findById(materialLotId, transaction);
    if (!lot) throw new ValidationError("El lote indicado no existe", { materialLotId });
    if (lot.status !== "active") throw new ValidationError("El lote indicado está inactivo", { materialLotId });
  }

  private stock(oldEffect: StockEffect | null, newEffect: StockEffect | null, transaction: Transaction): Promise<void> {
    return applyStockChange(
      this.lotsRepository,
      oldEffect,
      newEffect,
      transaction,
      "El lote no tiene existencias suficientes para la venta"
    );
  }

  private async reloadResponse(id: number, transaction: Transaction): Promise<MaterialSaleResponseDto> {
    return toMaterialSaleResponse((await this.repository.findById(id, transaction))!);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<MaterialSale> {
    const sale = await this.repository.findById(id, transaction);
    if (!sale) {
      throw new NotFoundError("Venta no encontrada");
    }
    return sale;
  }

  // Whitelists known fields and checks types, ranges and dates; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchMaterialSaleDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchMaterialSaleDto = {};

    if (body.totalAmount !== undefined) {
      errors.push("totalAmount no se envía: el servidor lo calcula como cantidad × precio");
    }

    for (const field of ["name", "buyerName"] as const) {
      const value = body[field];
      if (value === undefined && partial) continue;
      if (typeof value !== "string" || value.trim() === "") {
        errors.push(`${field} es obligatorio y debe ser un texto no vacío`);
      } else if (value.trim().length > TEXT_MAX_LENGTH) {
        errors.push(`${field} admite máximo ${TEXT_MAX_LENGTH} caracteres`);
      } else {
        dto[field] = value.trim();
      }
    }

    if (body.materialLotId !== undefined || !partial) {
      const value = body.materialLotId;
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        errors.push("materialLotId es obligatorio y debe ser un número entero positivo");
      } else {
        dto.materialLotId = value;
      }
    }

    for (const field of ["quantityKg", "unitPricePerKg"] as const) {
      const value = body[field];
      if (value === undefined && partial) continue;
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        errors.push(`${field} es obligatorio y debe ser un número mayor que 0`);
      } else if (value > MAX_AMOUNT || !hasAtMostTwoDecimals(value)) {
        errors.push(`${field} admite máximo 2 decimales y hasta ${MAX_AMOUNT}`);
      } else {
        dto[field] = value;
      }
    }

    if (body.saleDate !== undefined) {
      const value = body.saleDate;
      if (!isValidDateOnly(value)) {
        errors.push("saleDate debe ser una fecha válida con formato YYYY-MM-DD");
      } else if (value > todayInBusinessZone()) {
        errors.push("saleDate no puede ser una fecha futura");
      } else {
        dto.saleDate = value;
      }
    }

    if (body.description !== undefined) {
      const value = body.description;
      if (value !== null && typeof value !== "string") {
        errors.push("description debe ser un texto o null");
      } else if (typeof value === "string" && value.trim().length > DESCRIPTION_MAX_LENGTH) {
        errors.push(`description admite máximo ${DESCRIPTION_MAX_LENGTH} caracteres`);
      } else {
        dto.description = value === null || value.trim() === "" ? null : value.trim();
      }
    }

    if (body.status !== undefined) {
      if (!MATERIAL_SALE_STATUSES.includes(body.status as MaterialSaleStatus)) {
        errors.push(`status debe ser uno de: ${MATERIAL_SALE_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as MaterialSaleStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de venta inválidos", errors);
    }
    return dto;
  }
}
