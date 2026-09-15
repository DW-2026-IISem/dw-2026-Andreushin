import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE } from '../../../../../../infrastructure/database/sequelize/sequelize.module.js';
import { ProductEntity } from '../../../../products/domain/entities/product.entity.js';
import { ProductNotFoundException } from '../../../../products/domain/exceptions/product-not-found.exception.js';
import { ProductModel } from '../../../../products/infrastructure/persistence/models/product.model.js';
import { ProductSaleEntity } from '../../../domain/entities/product-sale.entity.js';
import { SaleEntity } from '../../../domain/entities/sale.entity.js';
import { SaleCalculator } from '../../../domain/services/sale-calculator.js';
import type {
  CreateSaleData,
  ISaleRepository,
} from '../../../domain/interfaces/sale.repository.interface.js';
import { ProductSaleModel } from '../models/product-sale.model.js';
import { SaleModel } from '../models/sale.model.js';

const SALE_STATUS_COMPLETED = 'COMPLETED';

interface ResolvedSaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

/**
 * Implementación concreta de `ISaleRepository` usando Sequelize.
 *
 * `create` envuelve toda la operación en una única transacción
 * (`sequelize.transaction`): por cada ítem bloquea la fila del producto
 * (`LOCK.UPDATE`), invoca la invariante de dominio `product.reduceStock`
 * (que lanza `InsufficientStockException` si falta stock) y solo si todos
 * los ítems se procesan sin error inserta la cabecera (`SaleModel`) y el
 * detalle (`ProductSaleModel`). Cualquier excepción revierte la transacción
 * completa (rollback total), incluyendo el stock ya descontado de ítems
 * anteriores dentro de la misma venta.
 */
@Injectable()
export class SaleRepository implements ISaleRepository {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async create(data: CreateSaleData): Promise<SaleEntity> {
    return this.sequelize.transaction(async (t) => {
      const resolvedItems: ResolvedSaleItem[] = [];

      for (const item of data.items) {
        const productModel = await ProductModel.findByPk(item.productId, {
          transaction: t,
          lock: Transaction.LOCK.UPDATE,
        });

        if (!productModel) {
          throw new ProductNotFoundException(item.productId);
        }

        const product = this.toProductDomain(productModel);
        const unitPrice = item.unitPrice ?? product.price;

        product.reduceStock(item.quantity);

        await productModel.update({ quantity: product.quantity }, { transaction: t });

        resolvedItems.push({ productId: item.productId, quantity: item.quantity, unitPrice });
      }

      const subtotal = SaleCalculator.calculateSubtotal(resolvedItems);
      const total = SaleCalculator.calculateTotal(subtotal, data.tax, data.discounts);

      const saleModel = await SaleModel.create(
        {
          saleDate: new Date(),
          clientId: data.clientId,
          subtotal,
          tax: data.tax,
          discounts: data.discounts,
          total,
          status: SALE_STATUS_COMPLETED,
        },
        { transaction: t },
      );

      const itemModels: ProductSaleModel[] = [];

      for (const item of resolvedItems) {
        const itemModel = await ProductSaleModel.create(
          {
            saleId: saleModel.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          },
          { transaction: t },
        );
        itemModels.push(itemModel);
      }

      return this.toDomain(saleModel, itemModels);
    });
  }

  async findById(id: number): Promise<SaleEntity | null> {
    const saleModel = await SaleModel.findByPk(id);

    if (!saleModel) {
      return null;
    }

    const itemModels = await ProductSaleModel.findAll({ where: { saleId: id } });
    return this.toDomain(saleModel, itemModels);
  }

  private toProductDomain(model: ProductModel): ProductEntity {
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

  private toDomain(saleModel: SaleModel, itemModels: ProductSaleModel[]): SaleEntity {
    const items = itemModels.map(
      (item) =>
        new ProductSaleEntity(
          item.id,
          item.saleId,
          item.productId,
          item.quantity,
          Number(item.unitPrice),
          Number(item.total),
        ),
    );

    return new SaleEntity(
      saleModel.id,
      saleModel.saleDate,
      Number(saleModel.subtotal),
      Number(saleModel.tax),
      Number(saleModel.discounts),
      Number(saleModel.total),
      saleModel.status,
      saleModel.clientId,
      items,
    );
  }
}
