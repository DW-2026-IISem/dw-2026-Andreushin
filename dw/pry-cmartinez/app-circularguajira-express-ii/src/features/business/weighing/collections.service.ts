import { Transaction } from "sequelize";
import { CollectionsRepository } from "./collections.repository";
import { WeighingsRepository } from "./weighings.repository";
import { SettlementsRepository } from "../settlements/settlements.repository";
import { RecyclersRepository } from "../collectors/recyclers.repository";
import { RoutesService } from "../routes/routes.service";
import { WeighingPricingService } from "./weighing-pricing.service";
import { Collection } from "./collection.model";
import { sumLines } from "./weighing.calculator";
import { BadRequestError, ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { withTransaction } from "../../../shared/database/transaction";
import { CollectionPatchDto } from "./dto/weighing.dto";
import { parseCollectionCreate, parseCollectionPatch, parseCollectionUpdate } from "./dto/weighing.validation";

/**
 * Collection (recolección) = header of the weighings. Every write runs in a transaction
 * and locks rows in the canonical order: collections -> weighings -> settlements.
 * A collection with an issued settlement is frozen (409) until the settlement is voided.
 */
export class CollectionsService {
  constructor(
    private readonly collectionsRepository = new CollectionsRepository(),
    private readonly weighingsRepository = new WeighingsRepository(),
    private readonly settlementsRepository = new SettlementsRepository(),
    private readonly recyclersRepository = new RecyclersRepository(),
    private readonly routesService = new RoutesService(),
    private readonly pricing = new WeighingPricingService()
  ) {}

  // ================== READ ==================

  getAll(): Promise<Collection[]> {
    return this.collectionsRepository.findAllActiveWithWeighings();
  }

  getOne(rawId: string): Promise<Collection> {
    return this.findActiveWithWeighings(parseId(rawId));
  }

  // ================== CREATE ==================

  // Header + weighings in one transaction: either everything is stored or nothing.
  async create(body: unknown): Promise<Collection> {
    const input = parseCollectionCreate(body);
    const collectionId = await withTransaction(async (transaction) => {
      await this.assertActiveRecycler(input.recyclerId);
      await this.routesService.assertActiveRoute(input.routeId);

      const lines = [];
      for (const item of input.weighings) {
        lines.push(await this.pricing.priceLine(item, input.collectedOn));
      }
      const totals = sumLines(lines);

      const collection = await this.collectionsRepository.create(
        {
          recyclerId: input.recyclerId,
          routeId: input.routeId,
          collectedOn: input.collectedOn,
          totalNetKg: totals.totalNetKg,
          totalAmount: totals.totalAmount,
          status: "active",
        },
        transaction
      );
      for (const line of lines) {
        await this.weighingsRepository.create(
          { ...line, collectionId: collection.id, status: "active" },
          transaction
        );
      }
      return collection.id;
    });
    return this.findActiveWithWeighings(collectionId);
  }

  // ================== UPDATE ==================

  // PUT: full header replacement.
  async update(rawId: string, body: unknown): Promise<Collection> {
    const id = parseId(rawId);
    const input = parseCollectionUpdate(body);
    await this.changeHeader(id, input);
    return this.findActiveWithWeighings(id);
  }

  // PATCH: only the fields sent change.
  async patch(rawId: string, body: unknown): Promise<Collection> {
    const id = parseId(rawId);
    const changes = parseCollectionPatch(body);
    await this.changeHeader(id, changes);
    return this.findActiveWithWeighings(id);
  }

  // ================== DELETE ==================

  // Physical delete: weighings and header; never once a settlement references it.
  async delete(rawId: string): Promise<void> {
    const id = parseId(rawId);
    await withTransaction(async (transaction) => {
      const collection = await this.collectionsRepository.findByIdForUpdate(id, transaction);
      if (!collection) {
        throw new NotFoundError("Recolección no encontrada");
      }
      const settlements = await this.settlementsRepository.countByCollection(id, transaction);
      if (settlements > 0) {
        throw new ConflictError(
          `La recolección tiene ${settlements} liquidación(es) registradas; no se puede eliminar`
        );
      }
      await this.weighingsRepository.deleteByCollection(id, transaction);
      await this.collectionsRepository.delete(collection, transaction);
    });
  }

  // Logical delete: the collection and its weighings become inactive.
  async deactivate(rawId: string): Promise<Collection> {
    const id = parseId(rawId);
    return withTransaction(async (transaction) => {
      const collection = await this.lockOpenCollection(id, transaction);
      await this.weighingsRepository.deactivateByCollection(id, transaction);
      return this.collectionsRepository.update(collection, { status: "inactive" }, transaction);
    });
  }

  // ================== SHARED RULES (also used by WeighingsService) ==================

  // Locks an active, unsettled collection: 404 if missing/inactive, 409 if settled.
  async lockOpenCollection(id: number, transaction: Transaction): Promise<Collection> {
    const collection = await this.collectionsRepository.findByIdForUpdate(id, transaction);
    if (!collection || collection.status !== "active") {
      throw new NotFoundError(`Recolección no encontrada o inactiva: ${id}`);
    }
    const settlement = await this.settlementsRepository.findIssuedByCollection(id, transaction);
    if (settlement) {
      throw new ConflictError(
        `La recolección ${id} está liquidada (liquidación ${settlement.id}); anula la liquidación para modificarla`
      );
    }
    return collection;
  }

  // Totals are always derived from the active weighings.
  async recalculateTotals(collection: Collection, transaction: Transaction): Promise<void> {
    const lines = await this.weighingsRepository.findActiveByCollection(collection.id, transaction);
    const totals = sumLines(lines);
    await this.collectionsRepository.update(
      collection,
      { totalNetKg: totals.totalNetKg, totalAmount: totals.totalAmount },
      transaction
    );
  }

  // ================== HELPERS ==================

  private async findActiveWithWeighings(id: number): Promise<Collection> {
    const collection = await this.collectionsRepository.findByIdWithWeighings(id);
    if (!collection || collection.status !== "active") {
      throw new NotFoundError("Recolección no encontrada o inactiva");
    }
    return collection;
  }

  // A new date may change the applicable rate: every active weighing is priced again.
  private async changeHeader(id: number, changes: CollectionPatchDto): Promise<void> {
    await withTransaction(async (transaction) => {
      const collection = await this.lockOpenCollection(id, transaction);
      if (changes.recyclerId !== undefined) await this.assertActiveRecycler(changes.recyclerId);
      if (changes.routeId !== undefined) await this.routesService.assertActiveRoute(changes.routeId);

      const dateChanged = changes.collectedOn !== undefined && changes.collectedOn !== collection.collectedOn;
      await this.collectionsRepository.update(collection, changes, transaction);
      if (dateChanged) {
        const lines = await this.weighingsRepository.findActiveByCollection(id, transaction);
        for (const line of lines) {
          const priced = await this.pricing.priceLine(line, collection.collectedOn, false);
          await this.weighingsRepository.update(line, priced, transaction);
        }
      }
      await this.recalculateTotals(collection, transaction);
    });
  }

  private async assertActiveRecycler(recyclerId: number): Promise<void> {
    const recycler = await this.recyclersRepository.findById(recyclerId);
    if (!recycler) {
      throw new NotFoundError(`Reciclador no encontrado: ${recyclerId}`);
    }
    if (recycler.status !== "active") {
      throw new BadRequestError(`El reciclador ${recyclerId} debe estar activo`);
    }
  }
}
