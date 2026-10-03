import { CreationAttributes, InferAttributes, Op, Transaction, WhereOptions } from "sequelize";
import { Route } from "../routes/route.model";
import { CollectionPoint } from "./collection-point.model";

export type CollectionPointChanges = Partial<Omit<InferAttributes<CollectionPoint>, "id" | "createdAt" | "updatedAt">>;

const withRoute = { model: Route, as: "route", attributes: ["id", "name", "municipality"] };

// Data access only: the single layer that talks to Sequelize.
export class CollectionPointsRepository {
  findAllActive(routeId?: number): Promise<CollectionPoint[]> {
    const where: WhereOptions<CollectionPoint> = { status: "active", ...(routeId !== undefined && { routeId }) };
    return CollectionPoint.findAll({ where, include: [withRoute], order: [["routeId", "ASC"], ["name", "ASC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<CollectionPoint | null> {
    return CollectionPoint.findByPk(id, { include: [withRoute], transaction });
  }

  findByNameAndRoute(
    name: string,
    routeId: number,
    excludeId?: number,
    transaction?: Transaction
  ): Promise<CollectionPoint | null> {
    return CollectionPoint.findOne({
      where: {
        name,
        routeId,
        ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }),
      },
      transaction,
    });
  }

  count(transaction?: Transaction): Promise<number> {
    return CollectionPoint.count({ transaction });
  }

  async create(data: CreationAttributes<CollectionPoint>, transaction?: Transaction): Promise<CollectionPoint> {
    const point = await CollectionPoint.create(data, { transaction });
    return point.reload({ include: [withRoute], transaction });
  }

  bulkCreate(rows: CreationAttributes<CollectionPoint>[], transaction?: Transaction): Promise<CollectionPoint[]> {
    return CollectionPoint.bulkCreate(rows, { transaction });
  }

  async update(point: CollectionPoint, changes: CollectionPointChanges, transaction?: Transaction): Promise<CollectionPoint> {
    await point.update(changes, { transaction });
    return point.reload({ include: [withRoute], transaction });
  }

  async delete(point: CollectionPoint, transaction?: Transaction): Promise<void> {
    await point.destroy({ transaction });
  }
}
