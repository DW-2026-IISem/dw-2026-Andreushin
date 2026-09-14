import { Injectable } from '@nestjs/common';
import { RecyclerEntity } from '../../../domain/entities/recycler.entity.js';
import { RecyclerNotFoundException } from '../../../domain/exceptions/recycler-not-found.exception.js';
import type {
  CreateRecyclerData,
  FindAllRecyclersParams,
  FindAllRecyclersResult,
  IRecyclerRepository,
  UpdateRecyclerData,
} from '../../../domain/interfaces/recycler.repository.interface.js';
import { RecyclerModel } from '../models/recycler.model.js';

/**
 * Implementación concreta de `IRecyclerRepository` usando Sequelize.
 * Traduce entre `RecyclerModel` (persistencia) y `RecyclerEntity` (dominio).
 */
@Injectable()
export class RecyclerRepository implements IRecyclerRepository {
  async create(data: CreateRecyclerData): Promise<RecyclerEntity> {
    const model = await RecyclerModel.create({ ...data });
    return this.toDomain(model);
  }

  async findAll(
    params: FindAllRecyclersParams,
  ): Promise<FindAllRecyclersResult> {
    const { page, limit } = params;

    const { rows, count } = await RecyclerModel.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'ASC']],
    });

    return { items: rows.map((row) => this.toDomain(row)), total: count };
  }

  async findById(id: number): Promise<RecyclerEntity | null> {
    const model = await RecyclerModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findByDocumentNumber(
    documentNumber: string,
  ): Promise<RecyclerEntity | null> {
    const model = await RecyclerModel.findOne({ where: { documentNumber } });
    return model ? this.toDomain(model) : null;
  }

  async update(id: number, data: UpdateRecyclerData): Promise<RecyclerEntity> {
    const model = await RecyclerModel.findByPk(id);

    if (!model) {
      throw new RecyclerNotFoundException(id);
    }

    await model.update({ ...data });
    return this.toDomain(model);
  }

  private toDomain(model: RecyclerModel): RecyclerEntity {
    return new RecyclerEntity(
      model.id,
      model.documentNumber,
      model.name,
      model.phone,
      model.email,
      model.address,
      model.isActive,
      model.createdAt,
      model.updatedAt,
    );
  }
}
