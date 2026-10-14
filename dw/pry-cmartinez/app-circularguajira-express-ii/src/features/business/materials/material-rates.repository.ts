import { Op, Transaction } from "sequelize";
import { MaterialRate, MaterialRateCreationAttributes } from "./material-rate.model";

export class MaterialRatesRepository {
  // ================== READ ==================

  // Newest period first. Inside a transaction the rows are locked until commit.
  findByMaterial(materialId: number, transaction?: Transaction): Promise<MaterialRate[]> {
    return MaterialRate.findAll({
      where: { materialId },
      order: [["validFrom", "DESC"]],
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });
  }

  // The rate whose period contains `date` (periods never overlap, so at most one).
  findApplicable(materialId: number, date: string): Promise<MaterialRate | null> {
    return MaterialRate.findOne({
      where: {
        materialId,
        validFrom: { [Op.lte]: date },
        [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: date } }],
      },
    });
  }

  findById(id: number): Promise<MaterialRate | null> {
    return MaterialRate.findByPk(id);
  }

  countByMaterial(materialId: number): Promise<number> {
    return MaterialRate.count({ where: { materialId } });
  }

  // ================== CREATE ==================

  create(data: MaterialRateCreationAttributes, transaction?: Transaction): Promise<MaterialRate> {
    return MaterialRate.create(data, { transaction });
  }

  // ================== UPDATE ==================

  close(rate: MaterialRate, validTo: string, transaction?: Transaction): Promise<MaterialRate> {
    return rate.update({ validTo }, { transaction });
  }
}
