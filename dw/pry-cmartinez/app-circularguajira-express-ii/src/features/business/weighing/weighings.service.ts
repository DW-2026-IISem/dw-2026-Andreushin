import { Transaction } from "sequelize";
import { WeighingsRepository } from "./weighings.repository";
import { CollectionsService } from "./collections.service";
import { WeighingPricingService } from "./weighing-pricing.service";
import { Weighing } from "./weighing.model";
import { Collection } from "./collection.model";
import { calculateLine } from "./weighing.calculator";
import { NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { withTransaction } from "../../../shared/database/transaction";
import { WeighingPatchDto } from "./dto/weighing.dto";
import {
  ensureNetWeight,
  parseWeighingCreate,
  parseWeighingPatch,
  parseWeighingUpdate,
} from "./dto/weighing.validation";

/**
 * Weighing (pesaje) = one material on the scale. Gross minus tare gives the net weight;
 * the applicable rate of the collection date gives the amount. Every write locks the
 * collection first (collections -> weighings) and recalculates its totals.
 */
export class WeighingsService {
  constructor(
    private readonly weighingsRepository = new WeighingsRepository(),
    private readonly collectionsService = new CollectionsService(),
    private readonly pricing = new WeighingPricingService()
  ) {}

  // ================== READ ==================

  getAll(): Promise<Weighing[]> {
    return this.weighingsRepository.findAllActive();
  }

  async getOne(rawId: string): Promise<Weighing> {
    const weighing = await this.weighingsRepository.findById(parseId(rawId));
    if (!weighing || weighing.status !== "active") {
      throw new NotFoundError("Pesaje no encontrado o inactivo");
    }
    return weighing;
  }

  // ================== CREATE ==================

  // Adds a line to an open collection.
  async create(body: unknown): Promise<Weighing> {
    const input = parseWeighingCreate(body);
    return withTransaction(async (transaction) => {
      const collection = await this.collectionsService.lockOpenCollection(input.collectionId, transaction);
      const priced = await this.pricing.priceLine(input, collection.collectedOn);
      const weighing = await this.weighingsRepository.create(
        { ...priced, collectionId: collection.id, status: "active" },
        transaction
      );
      await this.collectionsService.recalculateTotals(collection, transaction);
      return weighing;
    });
  }

  // ================== UPDATE ==================

  // PUT: both weights. The rate keeps following the collection date.
  update(rawId: string, body: unknown): Promise<Weighing> {
    return this.changeWeights(parseId(rawId), parseWeighingUpdate(body));
  }

  // PATCH: one or both weights.
  patch(rawId: string, body: unknown): Promise<Weighing> {
    return this.changeWeights(parseId(rawId), parseWeighingPatch(body));
  }

  // ================== DELETE ==================

  // Physical delete: also purges an inactive line of an open collection.
  async delete(rawId: string): Promise<void> {
    const id = parseId(rawId);
    await withTransaction(async (transaction) => {
      const { weighing, collection } = await this.lockLine(id, transaction, false);
      await this.weighingsRepository.delete(weighing, transaction);
      await this.collectionsService.recalculateTotals(collection, transaction);
    });
  }

  // Logical delete: the line stops counting in the collection totals.
  async deactivate(rawId: string): Promise<Weighing> {
    const id = parseId(rawId);
    return withTransaction(async (transaction) => {
      const { weighing, collection } = await this.lockLine(id, transaction);
      await this.weighingsRepository.update(weighing, { status: "inactive" }, transaction);
      await this.collectionsService.recalculateTotals(collection, transaction);
      return weighing;
    });
  }

  // ================== HELPERS ==================

  private async changeWeights(id: number, changes: WeighingPatchDto): Promise<Weighing> {
    return withTransaction(async (transaction) => {
      const { weighing, collection } = await this.lockLine(id, transaction);
      const grossKg = changes.grossKg ?? weighing.grossKg;
      const tareKg = changes.tareKg ?? weighing.tareKg;
      ensureNetWeight(grossKg, tareKg);
      await this.weighingsRepository.update(
        weighing,
        { grossKg, tareKg, ...calculateLine(grossKg, tareKg, weighing.pricePerKg) },
        transaction
      );
      await this.collectionsService.recalculateTotals(collection, transaction);
      return weighing;
    });
  }

  /**
   * Canonical lock order: the collection first, then the line. collectionId is immutable,
   * so it is read without a lock to know which parent row to lock.
   */
  private async lockLine(
    id: number,
    transaction: Transaction,
    onlyActive = true
  ): Promise<{ weighing: Weighing; collection: Collection }> {
    const snapshot = await this.weighingsRepository.findById(id, transaction);
    if (!snapshot) {
      throw new NotFoundError("Pesaje no encontrado");
    }
    const collection = await this.collectionsService.lockOpenCollection(snapshot.collectionId, transaction);
    const weighing = await this.weighingsRepository.findByIdForUpdate(id, transaction);
    if (!weighing || (onlyActive && weighing.status !== "active")) {
      throw new NotFoundError("Pesaje no encontrado o inactivo");
    }
    return { weighing, collection };
  }
}
