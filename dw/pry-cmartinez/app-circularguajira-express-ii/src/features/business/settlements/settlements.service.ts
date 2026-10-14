import { SettlementsRepository } from "./settlements.repository";
import { CollectionsRepository } from "../weighing/collections.repository";
import { WeighingsRepository } from "../weighing/weighings.repository";
import { MaterialRatesService } from "../materials/material-rates.service";
import { MaterialRatesRepository } from "../materials/material-rates.repository";
import { Settlement } from "./settlement.model";
import { Collection } from "../weighing/collection.model";
import { Weighing } from "../weighing/weighing.model";
import { calculateLine, sumLines, Totals } from "../weighing/weighing.calculator";
import { BadRequestError, ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { withTransaction } from "../../../shared/database/transaction";
import { parseSettlementCreate, parseSettlementNotes } from "./dto/settlement.validation";

export interface VerifiedLine {
  weighingId: number;
  materialId: number;
  grossKg: number;
  tareKg: number;
  netKg: number;
  pricePerKg: number;
  amount: number;
  rateId: number;
  rateValidFrom: string | null;
  rateValidTo: string | null;
  netOk: boolean;
  amountOk: boolean;
  rateOk: boolean;
}

export interface SettlementVerification {
  settlementId: number;
  status: Settlement["status"];
  collectionId: number;
  collectedOn: string;
  consistent: boolean;
  stored: Totals;
  recomputed: Totals;
  lines: VerifiedLine[];
}

/**
 * Settlement (liquidación) of one collection. Issuing it confirms the applicable rate of
 * every weighing for the collection date, freezes the totals and locks the collection.
 * Amounts are never edited: a wrong settlement is voided and issued again.
 */
export class SettlementsService {
  constructor(
    private readonly settlementsRepository = new SettlementsRepository(),
    private readonly collectionsRepository = new CollectionsRepository(),
    private readonly weighingsRepository = new WeighingsRepository(),
    private readonly materialRatesService = new MaterialRatesService(),
    private readonly materialRatesRepository = new MaterialRatesRepository()
  ) {}

  // ================== READ ==================

  getAll(): Promise<Settlement[]> {
    return this.settlementsRepository.findAllIssued();
  }

  async getOne(rawId: string): Promise<Settlement> {
    return this.findIssuedWithDetail(parseId(rawId));
  }

  // Recomputes every line and the totals from the stored references and compares.
  async verify(rawId: string): Promise<SettlementVerification> {
    const settlement = await this.settlementsRepository.findByIdWithDetail(parseId(rawId));
    if (!settlement) {
      throw new NotFoundError("Liquidación no encontrada");
    }
    const collection = settlement.get("collection") as Collection;
    const weighings = collection.get("weighings") as Weighing[];

    const lines: VerifiedLine[] = [];
    for (const weighing of weighings) {
      const expected = calculateLine(weighing.grossKg, weighing.tareKg, weighing.pricePerKg);
      const rate = await this.materialRatesRepository.findById(weighing.rateId);
      const rateOk =
        rate !== null &&
        rate.materialId === weighing.materialId &&
        rate.pricePerKg === weighing.pricePerKg &&
        rate.validFrom <= collection.collectedOn &&
        (rate.validTo === null || rate.validTo >= collection.collectedOn);
      lines.push({
        weighingId: weighing.id,
        materialId: weighing.materialId,
        grossKg: weighing.grossKg,
        tareKg: weighing.tareKg,
        netKg: weighing.netKg,
        pricePerKg: weighing.pricePerKg,
        amount: weighing.amount,
        rateId: weighing.rateId,
        rateValidFrom: rate?.validFrom ?? null,
        rateValidTo: rate?.validTo ?? null,
        netOk: expected.netKg === weighing.netKg,
        amountOk: expected.amount === weighing.amount,
        rateOk,
      });
    }

    const stored: Totals = {
      totalNetKg: settlement.totalNetKg,
      totalAmount: settlement.totalAmount,
      lineCount: settlement.lineCount,
    };
    const recomputed = sumLines(
      weighings.map((w) => calculateLine(w.grossKg, w.tareKg, w.pricePerKg))
    );
    const totalsOk =
      recomputed.totalNetKg === stored.totalNetKg &&
      recomputed.totalAmount === stored.totalAmount &&
      recomputed.lineCount === stored.lineCount;

    return {
      settlementId: settlement.id,
      status: settlement.status,
      collectionId: collection.id,
      collectedOn: collection.collectedOn,
      consistent: totalsOk && lines.every((l) => l.netOk && l.amountOk && l.rateOk),
      stored,
      recomputed,
      lines,
    };
  }

  // ================== CREATE ==================

  async create(body: unknown): Promise<Settlement> {
    const input = parseSettlementCreate(body);
    const settlementId = await withTransaction(async (transaction) => {
      // Canonical lock order: collections -> weighings -> settlements.
      const collection = await this.collectionsRepository.findByIdForUpdate(input.collectionId, transaction);
      if (!collection || collection.status !== "active") {
        throw new NotFoundError(`Recolección no encontrada o inactiva: ${input.collectionId}`);
      }
      const issued = await this.settlementsRepository.findIssuedByCollection(collection.id, transaction);
      if (issued) {
        throw new ConflictError(`La recolección ${collection.id} ya está liquidada (liquidación ${issued.id})`);
      }
      const lines = await this.weighingsRepository.findActiveByCollection(collection.id, transaction);
      if (lines.length === 0) {
        throw new BadRequestError(`La recolección ${collection.id} no tiene pesajes activos para liquidar`);
      }

      // The rate applied must be the one valid on the collection date (rates may have been
      // re-periodized since the weighing): a line with another rate is priced again.
      for (const line of lines) {
        const rate = await this.materialRatesService.findApplicableOrFail(line.materialId, collection.collectedOn);
        if (rate.id !== line.rateId || rate.pricePerKg !== line.pricePerKg) {
          await this.weighingsRepository.update(
            line,
            { rateId: rate.id, pricePerKg: rate.pricePerKg, ...calculateLine(line.grossKg, line.tareKg, rate.pricePerKg) },
            transaction
          );
        }
      }

      const totals = sumLines(lines);
      await this.collectionsRepository.update(
        collection,
        { totalNetKg: totals.totalNetKg, totalAmount: totals.totalAmount },
        transaction
      );
      const settlement = await this.settlementsRepository.create(
        {
          collectionId: collection.id,
          recyclerId: collection.recyclerId,
          settledAt: new Date(),
          totalNetKg: totals.totalNetKg,
          totalAmount: totals.totalAmount,
          lineCount: totals.lineCount,
          status: "issued",
          notes: input.notes,
        },
        transaction
      );
      return settlement.id;
    });
    return this.findIssuedWithDetail(settlementId);
  }

  // ================== UPDATE ==================

  // PUT and PATCH: only the notes; the settled values never change.
  async updateNotes(rawId: string, body: unknown): Promise<Settlement> {
    const id = parseId(rawId);
    const settlement = await this.findIssued(id);
    const input = parseSettlementNotes(body);
    await this.settlementsRepository.update(settlement, input);
    return this.findIssuedWithDetail(id);
  }

  // ================== DELETE ==================

  // Logical delete (void): the settlement stays as history and the collection reopens.
  async void(rawId: string): Promise<Settlement> {
    const settlement = await this.findIssued(parseId(rawId));
    return this.settlementsRepository.update(settlement, { status: "voided" });
  }

  // Physical delete only for a voided settlement: an issued one is a payment record.
  async delete(rawId: string): Promise<void> {
    const settlement = await this.settlementsRepository.findById(parseId(rawId));
    if (!settlement) {
      throw new NotFoundError("Liquidación no encontrada");
    }
    if (settlement.status === "issued") {
      throw new ConflictError("La liquidación está emitida; anúlala antes de eliminarla");
    }
    await this.settlementsRepository.delete(settlement);
  }

  // ================== HELPERS ==================

  private async findIssued(id: number): Promise<Settlement> {
    const settlement = await this.settlementsRepository.findById(id);
    if (!settlement || settlement.status !== "issued") {
      throw new NotFoundError("Liquidación no encontrada o anulada");
    }
    return settlement;
  }

  private async findIssuedWithDetail(id: number): Promise<Settlement> {
    const settlement = await this.settlementsRepository.findByIdWithDetail(id);
    if (!settlement || settlement.status !== "issued") {
      throw new NotFoundError("Liquidación no encontrada o anulada");
    }
    return settlement;
  }
}
