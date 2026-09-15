import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { MaterialRateEntity } from '../../../domain/entities/material-rate.entity.js';
import type {
  CreateMaterialRateData,
  FindAllMaterialRatesParams,
  FindAllMaterialRatesResult,
  IMaterialRateRepository,
} from '../../../domain/interfaces/material-rate.repository.interface.js';
import { MaterialRateModel } from '../models/material-rate.model.js';

/**
 * Implementación concreta de `IMaterialRateRepository` usando Sequelize.
 * Traduce entre `MaterialRateModel` (persistencia) y `MaterialRateEntity`
 * (dominio).
 */
@Injectable()
export class MaterialRateRepository implements IMaterialRateRepository {
  async create(data: CreateMaterialRateData): Promise<MaterialRateEntity> {
    const model = await MaterialRateModel.create({ ...data });
    return this.toDomain(model);
  }

  async findAll(
    params: FindAllMaterialRatesParams,
  ): Promise<FindAllMaterialRatesResult> {
    const { page, limit } = params;

    const { rows, count } = await MaterialRateModel.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'ASC']],
    });

    return { items: rows.map((row) => this.toDomain(row)), total: count };
  }

  async findById(id: number): Promise<MaterialRateEntity | null> {
    const model = await MaterialRateModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findActiveRateByMaterialAndDate(
    materialId: number,
    date: Date,
  ): Promise<MaterialRateEntity | null> {
    // DATEONLY se compara como cadena `YYYY-MM-DD`; usar el componente UTC
    // de `date` evita que la zona horaria local desplace el día (p. ej.
    // UTC-5 restaría un día si se comparara con el objeto `Date` crudo).
    const dateOnly = date.toISOString().slice(0, 10);

    const model = await MaterialRateModel.findOne({
      where: {
        materialId,
        isActive: true,
        startDate: { [Op.lte]: dateOnly },
        [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: dateOnly } }],
      },
      order: [['startDate', 'DESC']],
    });

    return model ? this.toDomain(model) : null;
  }

  async count(): Promise<number> {
    return MaterialRateModel.count();
  }

  private toDomain(model: MaterialRateModel): MaterialRateEntity {
    return new MaterialRateEntity(
      model.id,
      model.materialId,
      Number(model.pricePerKg),
      Number(model.minStockKg),
      Number(model.stockKg),
      model.startDate,
      model.endDate,
      model.isActive,
    );
  }
}
