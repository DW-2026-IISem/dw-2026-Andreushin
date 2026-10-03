import { CreationAttributes, InferAttributes, Op, Transaction, WhereOptions } from "sequelize";
import { Recycler } from "../recyclers/recycler.model";
import { Route } from "../routes/route.model";
import { Collection } from "./collection.model";

export type CollectionChanges = Partial<Omit<InferAttributes<Collection>, "id" | "createdAt" | "updatedAt">>;
export interface CollectionFilters {
  recyclerId?: number;
  routeId?: number;
}

const withRelations = [
  { model: Recycler, as: "recycler", attributes: ["id", "name", "documentNumber"] },
  { model: Route, as: "route", attributes: ["id", "name", "municipality"] },
];

// Data access only: the single layer that talks to Sequelize.
export class CollectionsRepository {
  findAllActive(filters: CollectionFilters = {}): Promise<Collection[]> {
    const where: WhereOptions<Collection> = {
      status: "active",
      ...(filters.recyclerId !== undefined && { recyclerId: filters.recyclerId }),
      ...(filters.routeId !== undefined && { routeId: filters.routeId }),
    };
    return Collection.findAll({ where, include: withRelations, order: [["collectionDate", "DESC"], ["id", "DESC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Collection | null> {
    return Collection.findByPk(id, { include: withRelations, transaction });
  }

  findDuplicate(
    recyclerId: number,
    routeId: number,
    collectionDate: string,
    excludeId?: number,
    transaction?: Transaction
  ): Promise<Collection | null> {
    return Collection.findOne({
      where: {
        recyclerId,
        routeId,
        collectionDate,
        ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }),
      },
      transaction,
    });
  }

  count(transaction?: Transaction): Promise<number> {
    return Collection.count({ transaction });
  }

  async create(data: CreationAttributes<Collection>, transaction?: Transaction): Promise<Collection> {
    const collection = await Collection.create(data, { transaction });
    return collection.reload({ include: withRelations, transaction });
  }

  bulkCreate(rows: CreationAttributes<Collection>[], transaction?: Transaction): Promise<Collection[]> {
    return Collection.bulkCreate(rows, { transaction });
  }

  async update(collection: Collection, changes: CollectionChanges, transaction?: Transaction): Promise<Collection> {
    await collection.update(changes, { transaction });
    return collection.reload({ include: withRelations, transaction });
  }

  async delete(collection: Collection, transaction?: Transaction): Promise<void> {
    await collection.destroy({ transaction });
  }
}
