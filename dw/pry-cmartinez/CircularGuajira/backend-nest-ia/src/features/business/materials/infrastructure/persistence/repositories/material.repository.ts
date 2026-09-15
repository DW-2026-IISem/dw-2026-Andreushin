import { Injectable } from '@nestjs/common';
import { MaterialEntity } from '../../../domain/entities/material.entity.js';
import { MaterialNotFoundException } from '../../../domain/exceptions/material-not-found.exception.js';
import type {
  CreateMaterialData,
  FindAllMaterialsParams,
  FindAllMaterialsResult,
  IMaterialRepository,
  UpdateMaterialData,
} from '../../../domain/interfaces/material.repository.interface.js';
import { MaterialModel } from '../models/material.model.js';

/**
 * Implementación concreta de `IMaterialRepository` usando Sequelize.
 * Traduce entre `MaterialModel` (persistencia) y `MaterialEntity` (dominio).
 */
@Injectable()
export class MaterialRepository implements IMaterialRepository {
  async create(data: CreateMaterialData): Promise<MaterialEntity> {
    const model = await MaterialModel.create({ ...data });
    return this.toDomain(model);
  }

  async findAll(
    params: FindAllMaterialsParams,
  ): Promise<FindAllMaterialsResult> {
    const { page, limit } = params;

    const { rows, count } = await MaterialModel.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'ASC']],
    });

    return { items: rows.map((row) => this.toDomain(row)), total: count };
  }

  async findById(id: number): Promise<MaterialEntity | null> {
    const model = await MaterialModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findByName(name: string): Promise<MaterialEntity | null> {
    const model = await MaterialModel.findOne({ where: { name } });
    return model ? this.toDomain(model) : null;
  }

  async update(id: number, data: UpdateMaterialData): Promise<MaterialEntity> {
    const model = await MaterialModel.findByPk(id);

    if (!model) {
      throw new MaterialNotFoundException(id);
    }

    await model.update({ ...data });
    return this.toDomain(model);
  }

  async count(): Promise<number> {
    return MaterialModel.count();
  }

  private toDomain(model: MaterialModel): MaterialEntity {
    return new MaterialEntity(
      model.id,
      model.name,
      model.description,
      model.unitOfMeasure,
      model.isActive,
      model.createdAt,
      model.updatedAt,
    );
  }
}
