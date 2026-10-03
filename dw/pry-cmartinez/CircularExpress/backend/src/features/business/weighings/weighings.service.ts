import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { hasAtMostTwoDecimals, roundTo2 } from "../../../shared/utils/numbers";
import { parseIdFilter } from "../../../shared/validation/query-filters";
import { CollectionsRepository } from "../collections/collections.repository";
import { MaterialLotsRepository } from "../material-lots/material-lots.repository";
import { MaterialsRepository } from "../materials/materials.repository";
import { CreateWeighingDto } from "./dto/create-weighing.dto";
import { PatchWeighingDto } from "./dto/patch-weighing.dto";
import { toWeighingResponse, WeighingResponseDto } from "./dto/weighing-response.dto";
import { Weighing, WEIGHING_STATUSES, WeighingStatus } from "./weighing.model";
import { WeighingsRepository } from "./weighings.repository";

const NAME_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 255;
const MAX_WEIGHT_KG = 99_999_999.99; // DECIMAL(10, 2)

// What a weighing contributes to a lot's stock: only active weighings linked to a lot count.
interface StockEffect {
  lotId: number;
  kg: number;
}

// The fields that decide references, net weight and stock effect after a write.
interface WeighingState {
  collectionId: number;
  materialId: number;
  materialLotId: number | null;
  grossWeightKg: number;
  tareWeightKg: number;
  status: WeighingStatus;
}

const effectOf = (state: Pick<WeighingState, "status" | "materialLotId"> & { netWeightKg: number }): StockEffect | null =>
  state.status === "active" && state.materialLotId ? { lotId: state.materialLotId, kg: state.netWeightKg } : null;

// Business rules for scale weighings: server-computed net weight, active references, lot/material
// coherence, and keeping each lot's stock (weightKg) equal to the net weight of its active weighings.
export class WeighingsService {
  constructor(
    private readonly repository: WeighingsRepository = new WeighingsRepository(),
    private readonly collectionsRepository: CollectionsRepository = new CollectionsRepository(),
    private readonly materialsRepository: MaterialsRepository = new MaterialsRepository(),
    private readonly lotsRepository: MaterialLotsRepository = new MaterialLotsRepository()
  ) {}

  async findAll(query: { collectionId?: unknown; materialId?: unknown; materialLotId?: unknown } = {}): Promise<WeighingResponseDto[]> {
    const weighings = await this.repository.findAllActive({
      collectionId: parseIdFilter(query.collectionId, "collectionId"),
      materialId: parseIdFilter(query.materialId, "materialId"),
      materialLotId: parseIdFilter(query.materialLotId, "materialLotId"),
    });
    return weighings.map(toWeighingResponse);
  }

  async findOne(id: number): Promise<WeighingResponseDto> {
    return toWeighingResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<WeighingResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateWeighingDto;
    const state: WeighingState = {
      collectionId: dto.collectionId,
      materialId: dto.materialId,
      materialLotId: dto.materialLotId ?? null,
      grossWeightKg: dto.grossWeightKg,
      tareWeightKg: dto.tareWeightKg ?? 0,
      status: dto.status ?? "active",
    };
    const netWeightKg = this.netOf(state);
    return withTransaction(async (transaction) => {
      await this.ensureReferences(state, null, transaction);
      // Update the lot BEFORE inserting: the insert's FK check takes a shared lock on the lot row, and
      // upgrading it to an exclusive lock afterwards deadlocks concurrent weighings of the same lot.
      await this.applyStockChange(null, effectOf({ ...state, netWeightKg }), transaction);
      const weighing = await this.repository.create(
        { ...state, name: dto.name, description: dto.description ?? null, netWeightKg },
        transaction
      );
      return this.reloadResponse(weighing.id, transaction);
    });
  }

  async replace(id: number, input: unknown): Promise<WeighingResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateWeighingDto;
    return withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      const state: WeighingState = {
        collectionId: dto.collectionId,
        materialId: dto.materialId,
        materialLotId: dto.materialLotId ?? null,
        grossWeightKg: dto.grossWeightKg,
        tareWeightKg: dto.tareWeightKg ?? 0,
        status: dto.status ?? current.status,
      };
      return this.write(current, state, { name: dto.name, description: dto.description ?? null }, transaction);
    });
  }

  async patch(id: number, input: unknown): Promise<WeighingResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      const state: WeighingState = {
        collectionId: dto.collectionId ?? current.collectionId,
        materialId: dto.materialId ?? current.materialId,
        materialLotId: dto.materialLotId !== undefined ? dto.materialLotId : current.materialLotId ?? null,
        grossWeightKg: dto.grossWeightKg ?? current.grossWeightKg,
        tareWeightKg: dto.tareWeightKg ?? current.tareWeightKg,
        status: dto.status ?? current.status,
      };
      const texts = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      };
      return this.write(current, state, texts, transaction);
    });
  }

  async deactivate(id: number): Promise<WeighingResponseDto> {
    return withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      if (current.status === "inactive") return toWeighingResponse(current);
      await this.applyStockChange(effectOf(current), null, transaction);
      await this.repository.update(current, { status: "inactive" }, transaction);
      return this.reloadResponse(id, transaction);
    });
  }

  async remove(id: number): Promise<void> {
    await withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      await this.applyStockChange(effectOf(current), null, transaction);
      await this.repository.delete(current, transaction);
    });
  }

  // Shared by PUT and PATCH: validates the resulting state, swaps the stock effect and saves.
  private async write(
    current: Weighing,
    state: WeighingState,
    texts: { name?: string; description?: string | null },
    transaction: Transaction
  ): Promise<WeighingResponseDto> {
    const netWeightKg = this.netOf(state);
    await this.ensureReferences(state, current, transaction);
    await this.applyStockChange(effectOf(current), effectOf({ ...state, netWeightKg }), transaction);
    await this.repository.update(current, { ...state, ...texts, netWeightKg }, transaction);
    return this.reloadResponse(current.id, transaction);
  }

  private netOf(state: WeighingState): number {
    if (state.tareWeightKg >= state.grossWeightKg) {
      throw new ValidationError("La tara debe ser menor que el peso bruto", {
        grossWeightKg: state.grossWeightKg,
        tareWeightKg: state.tareWeightKg,
      });
    }
    return roundTo2(state.grossWeightKg - state.tareWeightKg);
  }

  // New or changed references must be active; a lot must always hold the weighing's material.
  private async ensureReferences(state: WeighingState, current: Weighing | null, transaction: Transaction): Promise<void> {
    if (!current || state.collectionId !== current.collectionId) {
      const collection = await this.collectionsRepository.findById(state.collectionId, transaction);
      if (!collection) throw new ValidationError("La jornada indicada no existe", { collectionId: state.collectionId });
      if (collection.status !== "active") {
        throw new ValidationError("La jornada indicada está inactiva", { collectionId: state.collectionId });
      }
    }
    if (!current || state.materialId !== current.materialId) {
      const material = await this.materialsRepository.findById(state.materialId, transaction);
      if (!material) throw new ValidationError("El material indicado no existe", { materialId: state.materialId });
      if (material.status !== "active") {
        throw new ValidationError("El material indicado está inactivo", { materialId: state.materialId });
      }
    }
    if (state.materialLotId) {
      const lot = await this.lotsRepository.findById(state.materialLotId, transaction);
      if (!lot) throw new ValidationError("El lote indicado no existe", { materialLotId: state.materialLotId });
      const lotChanged = !current || state.materialLotId !== current.materialLotId;
      if (lotChanged && lot.status !== "active") {
        throw new ValidationError("El lote indicado está inactivo", { materialLotId: state.materialLotId });
      }
      if (lot.materialId !== state.materialId) {
        throw new ValidationError("El lote no corresponde al material del pesaje", {
          materialId: state.materialId,
          lotMaterialId: lot.materialId,
        });
      }
    }
  }

  // Removes the old effect and adds the new one with atomic UPDATEs (lots in id order to avoid deadlocks).
  // A lot can never go below 0 kg: that would mean un-weighing material that was already sold.
  private async applyStockChange(oldEffect: StockEffect | null, newEffect: StockEffect | null, transaction: Transaction): Promise<void> {
    const deltas = new Map<number, number>();
    if (oldEffect) deltas.set(oldEffect.lotId, (deltas.get(oldEffect.lotId) ?? 0) - oldEffect.kg);
    if (newEffect) deltas.set(newEffect.lotId, (deltas.get(newEffect.lotId) ?? 0) + newEffect.kg);

    for (const lotId of [...deltas.keys()].sort((a, b) => a - b)) {
      const delta = roundTo2(deltas.get(lotId)!);
      if (delta === 0) continue;
      if (await this.lotsRepository.adjustWeight(lotId, delta, transaction)) continue;
      const lot = await this.lotsRepository.findById(lotId, transaction);
      if (!lot) throw new ValidationError("El lote indicado no existe", { materialLotId: lotId });
      throw new ConflictError("El lote no tiene existencias suficientes para revertir el pesaje", {
        materialLotId: lotId,
        stockKg: lot.weightKg,
        requiredKg: -delta,
      });
    }
  }

  private async reloadResponse(id: number, transaction: Transaction): Promise<WeighingResponseDto> {
    return toWeighingResponse((await this.repository.findById(id, transaction))!);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<Weighing> {
    const weighing = await this.repository.findById(id, transaction);
    if (!weighing) {
      throw new NotFoundError("Pesaje no encontrado");
    }
    return weighing;
  }

  // Whitelists known fields and checks types and ranges; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchWeighingDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchWeighingDto = {};

    if (body.netWeightKg !== undefined) {
      errors.push("netWeightKg no se envía: el servidor lo calcula como bruto − tara");
    }

    if (body.name !== undefined || !partial) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("name es obligatorio y debe ser un texto no vacío");
      } else if (body.name.trim().length > NAME_MAX_LENGTH) {
        errors.push(`name admite máximo ${NAME_MAX_LENGTH} caracteres`);
      } else {
        dto.name = body.name.trim();
      }
    }

    for (const field of ["collectionId", "materialId"] as const) {
      const value = body[field];
      if (value === undefined && partial) continue;
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        errors.push(`${field} es obligatorio y debe ser un número entero positivo`);
      } else {
        dto[field] = value;
      }
    }

    if (body.materialLotId !== undefined) {
      const value = body.materialLotId;
      if (value !== null && (typeof value !== "number" || !Number.isInteger(value) || value <= 0)) {
        errors.push("materialLotId debe ser un número entero positivo o null");
      } else {
        dto.materialLotId = value as number | null;
      }
    }

    const weights: [keyof Pick<PatchWeighingDto, "grossWeightKg" | "tareWeightKg">, boolean][] = [
      ["grossWeightKg", true],
      ["tareWeightKg", false],
    ];
    for (const [field, required] of weights) {
      const value = body[field];
      if (value === undefined) {
        if (required && !partial) errors.push(`${field} es obligatorio`);
        continue;
      }
      const min = field === "grossWeightKg" ? "mayor que 0" : "mayor o igual a 0";
      if (typeof value !== "number" || !Number.isFinite(value) || (field === "grossWeightKg" ? value <= 0 : value < 0)) {
        errors.push(`${field} debe ser un número ${min}`);
      } else if (value > MAX_WEIGHT_KG || !hasAtMostTwoDecimals(value)) {
        errors.push(`${field} admite máximo 2 decimales y hasta ${MAX_WEIGHT_KG}`);
      } else {
        dto[field] = value;
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
      if (!WEIGHING_STATUSES.includes(body.status as WeighingStatus)) {
        errors.push(`status debe ser uno de: ${WEIGHING_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as WeighingStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de pesaje inválidos", errors);
    }
    return dto;
  }
}
