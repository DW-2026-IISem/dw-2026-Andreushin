import { Injectable } from '@nestjs/common';
import { ProductEntity } from '../../../domain/entities/product.entity.js';
import { ProductNotFoundException } from '../../../domain/exceptions/product-not-found.exception.js';
import type {
  CreateProductData,
  FindAllProductsParams,
  FindAllProductsResult,
  IProductRepository,
  UpdateProductData,
} from '../../../domain/interfaces/product.repository.interface.js';
import { ProductModel } from '../models/product.model.js';

/**
 * Implementación concreta de `IProductRepository` usando Sequelize.
 * Traduce entre `ProductModel` (persistencia) y `ProductEntity` (dominio).
 */
@Injectable()
export class ProductRepository implements IProductRepository {
  async create(data: CreateProductData): Promise<ProductEntity> {
    const model = await ProductModel.create({ ...data });
    return this.toDomain(model);
  }

  async findAll(params: FindAllProductsParams): Promise<FindAllProductsResult> {
    const { page, limit } = params;

    const { rows, count } = await ProductModel.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'ASC']],
    });

    return { items: rows.map((row) => this.toDomain(row)), total: count };
  }

  async findById(id: number): Promise<ProductEntity | null> {
    const model = await ProductModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async update(id: number, data: UpdateProductData): Promise<ProductEntity> {
    const model = await ProductModel.findByPk(id);

    if (!model) {
      throw new ProductNotFoundException(id);
    }

    await model.update({ ...data });
    return this.toDomain(model);
  }

  async count(): Promise<number> {
    return ProductModel.count();
  }

  private toDomain(model: ProductModel): ProductEntity {
    return new ProductEntity(
      model.id,
      model.name,
      model.brand,
      Number(model.price),
      model.minStock,
      model.quantity,
      model.materialId,
      model.isActive,
      model.createdAt,
      model.updatedAt,
    );
  }
}
