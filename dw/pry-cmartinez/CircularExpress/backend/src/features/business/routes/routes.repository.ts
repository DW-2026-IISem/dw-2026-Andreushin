import { CreationAttributes, InferAttributes, Op, Transaction } from "sequelize";
import { Route } from "./route.model";

export type RouteChanges = Partial<Omit<InferAttributes<Route>, "id" | "createdAt" | "updatedAt">>;

// Data access only: the single layer that talks to Sequelize.
export class RoutesRepository {
  findAllActive(): Promise<Route[]> {
    return Route.findAll({ where: { status: "active" }, order: [["municipality", "ASC"], ["name", "ASC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Route | null> {
    return Route.findByPk(id, { transaction });
  }

  findByNameAndMunicipality(
    name: string,
    municipality: string,
    excludeId?: number,
    transaction?: Transaction
  ): Promise<Route | null> {
    return Route.findOne({
      where: {
        name,
        municipality,
        ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }),
      },
      transaction,
    });
  }

  count(transaction?: Transaction): Promise<number> {
    return Route.count({ transaction });
  }

  create(data: CreationAttributes<Route>, transaction?: Transaction): Promise<Route> {
    return Route.create(data, { transaction });
  }

  bulkCreate(rows: CreationAttributes<Route>[], transaction?: Transaction): Promise<Route[]> {
    return Route.bulkCreate(rows, { transaction });
  }

  update(route: Route, changes: RouteChanges, transaction?: Transaction): Promise<Route> {
    return route.update(changes, { transaction });
  }

  async delete(route: Route, transaction?: Transaction): Promise<void> {
    await route.destroy({ transaction });
  }
}
