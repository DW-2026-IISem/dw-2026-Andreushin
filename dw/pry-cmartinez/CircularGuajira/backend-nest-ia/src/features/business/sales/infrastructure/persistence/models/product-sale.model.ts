import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { registerSequelizeModel } from '../../../../../../infrastructure/database/sequelize/sequelize-model.registry.js';
import { ProductModel } from '../../../../products/infrastructure/persistence/models/product.model.js';
import { SaleModel } from './sale.model.js';

@Table({ tableName: 'product_sales', timestamps: false })
export class ProductSaleModel extends Model {
  @ForeignKey(() => SaleModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare saleId: number;

  @BelongsTo(() => SaleModel)
  declare sale?: SaleModel;

  @ForeignKey(() => ProductModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare productId: number;

  @BelongsTo(() => ProductModel)
  declare product?: ProductModel;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantity: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare unitPrice: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare total: number;
}

registerSequelizeModel(ProductSaleModel);
