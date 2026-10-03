import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { isValidDateOnly, todayInBusinessZone } from "../../../shared/utils/dates";
import { roundTo2 } from "../../../shared/utils/numbers";
import { parseIdFilter } from "../../../shared/validation/query-filters";
import { MaterialRatesRepository } from "../material-rates/material-rates.repository";
import { RecyclersRepository } from "../recyclers/recyclers.repository";
import { WeighingsRepository } from "../weighings/weighings.repository";
import { CreateSettlementDto } from "./dto/create-settlement.dto";
import { PatchSettlementDto } from "./dto/patch-settlement.dto";
import { SettlementLineDto, SettlementResponseDto, toSettlementResponse } from "./dto/settlement-response.dto";
import { Settlement, SETTLEMENT_STATES, SettlementState } from "./settlement.model";
import { SettlementChanges, SettlementsRepository } from "./settlements.repository";

const REFERENCE_MAX_LENGTH = 40;
const OBSERVATIONS_MAX_LENGTH = 255;

// Approval workflow: paid and rejected are final.
const TRANSITIONS: Record<SettlementState, SettlementState[]> = {
  pending: ["approved", "rejected"],
  approved: ["paid", "rejected"],
  paid: [],
  rejected: [],
};

interface Calculation {
  totalWeightKg: number;
  weighingsCount: number;
  amount: number;
  breakdown: SettlementLineDto[];
}

// Business rules for settlements: amounts computed from the period's weighings priced with the rate valid
// on each collection date, approval workflow, no overlapping live periods per recycler, and immutability
// once approved or paid.
export class SettlementsService {
  constructor(
    private readonly repository: SettlementsRepository = new SettlementsRepository(),
    private readonly recyclersRepository: RecyclersRepository = new RecyclersRepository(),
    private readonly weighingsRepository: WeighingsRepository = new WeighingsRepository(),
    private readonly ratesRepository: MaterialRatesRepository = new MaterialRatesRepository()
  ) {}

  async findAll(query: { recyclerId?: unknown; state?: unknown } = {}): Promise<SettlementResponseDto[]> {
    let state: SettlementState | undefined;
    if (query.state !== undefined) {
      if (!SETTLEMENT_STATES.includes(query.state as SettlementState)) {
        throw new ValidationError(`state debe ser uno de: ${SETTLEMENT_STATES.join(", ")}`);
      }
      state = query.state as SettlementState;
    }
    const settlements = await this.repository.findAllActive({ recyclerId: parseIdFilter(query.recyclerId, "recyclerId"), state });
    return settlements.map((settlement) => toSettlementResponse(settlement));
  }

  async findOne(id: number): Promise<SettlementResponseDto> {
    return toSettlementResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<SettlementResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateSettlementDto;
    this.ensurePeriod(dto.periodStart, dto.periodEnd);
    return withTransaction(async (transaction) => {
      await this.ensureActiveRecycler(dto.recyclerId, transaction);
      await this.ensureNoOverlap(dto.recyclerId, dto.periodStart, dto.periodEnd, undefined, transaction);
      const referenceCode = dto.referenceCode ?? (await this.nextReferenceCode(dto.recyclerId, dto.periodEnd, transaction));
      await this.ensureUniqueReference(referenceCode, undefined, transaction);
      const calculation = await this.calculate(dto.recyclerId, dto.periodStart, dto.periodEnd, transaction);
      const settlement = await this.repository.create(
        {
          referenceCode,
          settlementDate: dto.settlementDate ?? todayInBusinessZone(),
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          totalWeightKg: calculation.totalWeightKg,
          weighingsCount: calculation.weighingsCount,
          amount: calculation.amount,
          state: "pending",
          observations: dto.observations ?? null,
          recyclerId: dto.recyclerId,
        },
        transaction
      );
      return toSettlementResponse(settlement, calculation.breakdown);
    });
  }

  // PUT: only pending settlements; always recalculates (picks up weighings registered since).
  async replace(id: number, input: unknown): Promise<SettlementResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateSettlementDto;
    this.ensurePeriod(dto.periodStart, dto.periodEnd);
    return withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      this.ensurePending(current);
      if (dto.recyclerId !== current.recyclerId) await this.ensureActiveRecycler(dto.recyclerId, transaction);
      await this.ensureNoOverlap(dto.recyclerId, dto.periodStart, dto.periodEnd, id, transaction);
      const referenceCode = dto.referenceCode ?? current.referenceCode;
      await this.ensureUniqueReference(referenceCode, id, transaction);
      const calculation = await this.calculate(dto.recyclerId, dto.periodStart, dto.periodEnd, transaction);
      const updated = await this.repository.update(
        current,
        {
          referenceCode,
          settlementDate: dto.settlementDate ?? todayInBusinessZone(),
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          observations: dto.observations ?? null,
          recyclerId: dto.recyclerId,
          ...this.totals(calculation),
        },
        transaction
      );
      return toSettlementResponse(updated, calculation.breakdown);
    });
  }

  // PATCH: observations in any state; recycler/period/reference/date only while pending (recalculates when
  // recycler or period change); `state` moves along the workflow.
  async patch(id: number, input: unknown): Promise<SettlementResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const current = await this.getOrFail(id, transaction);
      if (current.status !== "active") {
        throw new ConflictError("La liquidación está anulada", { id });
      }
      const changes: SettlementChanges = {};
      let breakdown: SettlementLineDto[] | undefined;

      const editsLockedFields = ["recyclerId", "periodStart", "periodEnd", "referenceCode", "settlementDate"].some(
        (field) => dto[field as keyof PatchSettlementDto] !== undefined
      );
      if (editsLockedFields) {
        this.ensurePending(current);
        const recyclerId = dto.recyclerId ?? current.recyclerId;
        const periodStart = dto.periodStart ?? current.periodStart;
        const periodEnd = dto.periodEnd ?? current.periodEnd;
        this.ensurePeriod(periodStart, periodEnd);
        if (recyclerId !== current.recyclerId) await this.ensureActiveRecycler(recyclerId, transaction);
        if (dto.referenceCode !== undefined) {
          await this.ensureUniqueReference(dto.referenceCode, id, transaction);
          changes.referenceCode = dto.referenceCode;
        }
        if (dto.settlementDate !== undefined) changes.settlementDate = dto.settlementDate;
        if (recyclerId !== current.recyclerId || periodStart !== current.periodStart || periodEnd !== current.periodEnd) {
          await this.ensureNoOverlap(recyclerId, periodStart, periodEnd, id, transaction);
          const calculation = await this.calculate(recyclerId, periodStart, periodEnd, transaction);
          Object.assign(changes, { recyclerId, periodStart, periodEnd, ...this.totals(calculation) });
          breakdown = calculation.breakdown;
        }
      }
      if (dto.observations !== undefined) changes.observations = dto.observations;
      const from = current.state as SettlementState;
      if (dto.state !== undefined && dto.state !== from) {
        if (!TRANSITIONS[from].includes(dto.state)) {
          throw new ConflictError(`No se puede pasar una liquidación de ${from} a ${dto.state}`, {
            from,
            to: dto.state,
            allowed: TRANSITIONS[from],
          });
        }
        changes.state = dto.state;
      }

      const updated = await this.repository.update(current, changes, transaction);
      return toSettlementResponse(updated, breakdown);
    });
  }

  async deactivate(id: number): Promise<SettlementResponseDto> {
    const current = await this.getOrFail(id);
    this.ensureRemovable(current);
    const updated = await this.repository.update(current, { status: "inactive" });
    return toSettlementResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const current = await this.getOrFail(id);
    this.ensureRemovable(current);
    await this.repository.delete(current);
  }

  // Prices every weighing with the rate whose validFrom is the latest one on or before its collection date.
  private async calculate(recyclerId: number, from: string, to: string, transaction: Transaction): Promise<Calculation> {
    const weighings = await this.weighingsRepository.findActiveForRecyclerInPeriod(recyclerId, from, to, transaction);
    const materialIds = [...new Set(weighings.map((weighing) => weighing.materialId))];
    const history = await this.ratesRepository.findHistoryForMaterials(materialIds, transaction);

    const lines = new Map<number, SettlementLineDto>();
    for (const weighing of weighings) {
      const date = weighing.collection!.collectionDate;
      const rate = history
        .filter((r) => r.materialId === weighing.materialId && r.validFrom <= date)
        .reduce<(typeof history)[number] | null>((latest, r) => (!latest || r.validFrom > latest.validFrom ? r : latest), null);
      const line = lines.get(weighing.materialId) ?? {
        materialId: weighing.materialId,
        materialName: weighing.material?.name ?? "",
        weighingsCount: 0,
        netWeightKg: 0,
        amount: 0,
        unpricedWeighings: 0,
      };
      line.weighingsCount++;
      line.netWeightKg = roundTo2(line.netWeightKg + weighing.netWeightKg);
      if (rate) line.amount = roundTo2(line.amount + weighing.netWeightKg * rate.pricePerKg);
      else line.unpricedWeighings++;
      lines.set(weighing.materialId, line);
    }

    const breakdown = [...lines.values()].sort((a, b) => a.materialName.localeCompare(b.materialName));
    return {
      totalWeightKg: roundTo2(breakdown.reduce((sum, line) => sum + line.netWeightKg, 0)),
      weighingsCount: weighings.length,
      amount: roundTo2(breakdown.reduce((sum, line) => sum + line.amount, 0)),
      breakdown,
    };
  }

  private totals({ totalWeightKg, weighingsCount, amount }: Calculation): SettlementChanges {
    return { totalWeightKg, weighingsCount, amount };
  }

  private async nextReferenceCode(recyclerId: number, periodEnd: string, transaction: Transaction): Promise<string> {
    const prefix = `LIQ-${periodEnd.slice(0, 7).replace("-", "")}-${recyclerId}-`;
    let sequence = (await this.repository.countByReferencePrefix(prefix, transaction)) + 1;
    while (await this.repository.findByReferenceCode(`${prefix}${String(sequence).padStart(3, "0")}`, undefined, transaction)) {
      sequence++;
    }
    return `${prefix}${String(sequence).padStart(3, "0")}`;
  }

  private ensurePeriod(periodStart: string, periodEnd: string): void {
    if (periodStart > periodEnd) {
      throw new ValidationError("periodStart debe ser anterior o igual a periodEnd", { periodStart, periodEnd });
    }
    if (periodEnd > todayInBusinessZone()) {
      throw new ValidationError("periodEnd no puede ser una fecha futura", { periodEnd });
    }
  }

  private ensurePending(settlement: Settlement): void {
    if (settlement.state !== "pending") {
      throw new ConflictError("Solo una liquidación pendiente puede cambiar de reciclador, período o referencia", {
        state: settlement.state,
      });
    }
  }

  private ensureRemovable(settlement: Settlement): void {
    if (settlement.state === "approved" || settlement.state === "paid") {
      throw new ConflictError("No se puede anular ni eliminar una liquidación aprobada o pagada", { state: settlement.state });
    }
  }

  private async ensureActiveRecycler(recyclerId: number, transaction: Transaction): Promise<void> {
    const recycler = await this.recyclersRepository.findById(recyclerId, transaction);
    if (!recycler) throw new ValidationError("El reciclador indicado no existe", { recyclerId });
    if (recycler.status !== "active") throw new ValidationError("El reciclador indicado está inactivo", { recyclerId });
  }

  private async ensureNoOverlap(
    recyclerId: number,
    from: string,
    to: string,
    excludeId: number | undefined,
    transaction: Transaction
  ): Promise<void> {
    const overlapping = await this.repository.findOverlapping(recyclerId, from, to, excludeId, transaction);
    if (overlapping) {
      throw new ConflictError("El reciclador ya tiene una liquidación vigente que cubre parte de ese período", {
        referenceCode: overlapping.referenceCode,
        periodStart: overlapping.periodStart,
        periodEnd: overlapping.periodEnd,
      });
    }
  }

  private async ensureUniqueReference(referenceCode: string, excludeId: number | undefined, transaction: Transaction): Promise<void> {
    if (await this.repository.findByReferenceCode(referenceCode, excludeId, transaction)) {
      throw new ConflictError("Ya existe una liquidación con ese código de referencia", { referenceCode });
    }
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<Settlement> {
    const settlement = await this.repository.findById(id, transaction);
    if (!settlement) {
      throw new NotFoundError("Liquidación no encontrada");
    }
    return settlement;
  }

  // Whitelists known fields and checks types and dates; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchSettlementDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchSettlementDto = {};

    for (const computed of ["amount", "totalWeightKg", "weighingsCount"]) {
      if (body[computed] !== undefined) errors.push(`${computed} no se envía: el servidor lo calcula a partir de los pesajes`);
    }
    if (body.status !== undefined) errors.push("status no se envía: use /deactivate para anular la liquidación");
    if (body.state !== undefined && !partial) {
      errors.push("state no se envía al crear o reemplazar: la liquidación inicia en pending y avanza con PATCH");
    }

    if (body.recyclerId !== undefined || !partial) {
      const value = body.recyclerId;
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        errors.push("recyclerId es obligatorio y debe ser un número entero positivo");
      } else {
        dto.recyclerId = value;
      }
    }

    for (const field of ["periodStart", "periodEnd"] as const) {
      const value = body[field];
      if (value === undefined && partial) continue;
      if (!isValidDateOnly(value)) {
        errors.push(`${field} es obligatorio y debe ser una fecha válida con formato YYYY-MM-DD`);
      } else {
        dto[field] = value;
      }
    }

    if (body.settlementDate !== undefined) {
      const value = body.settlementDate;
      if (!isValidDateOnly(value)) {
        errors.push("settlementDate debe ser una fecha válida con formato YYYY-MM-DD");
      } else if (value > todayInBusinessZone()) {
        errors.push("settlementDate no puede ser una fecha futura");
      } else {
        dto.settlementDate = value;
      }
    }

    if (body.referenceCode !== undefined) {
      const value = body.referenceCode;
      if (typeof value !== "string" || value.trim() === "" || value.trim().length > REFERENCE_MAX_LENGTH) {
        errors.push(`referenceCode debe ser un texto no vacío de máximo ${REFERENCE_MAX_LENGTH} caracteres`);
      } else {
        dto.referenceCode = value.trim();
      }
    }

    if (body.observations !== undefined) {
      const value = body.observations;
      if (value !== null && typeof value !== "string") {
        errors.push("observations debe ser un texto o null");
      } else if (typeof value === "string" && value.trim().length > OBSERVATIONS_MAX_LENGTH) {
        errors.push(`observations admite máximo ${OBSERVATIONS_MAX_LENGTH} caracteres`);
      } else {
        dto.observations = value === null || value.trim() === "" ? null : value.trim();
      }
    }

    if (body.state !== undefined && partial) {
      if (!SETTLEMENT_STATES.includes(body.state as SettlementState)) {
        errors.push(`state debe ser uno de: ${SETTLEMENT_STATES.join(", ")}`);
      } else {
        dto.state = body.state as SettlementState;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de liquidación inválidos", errors);
    }
    return dto;
  }
}
