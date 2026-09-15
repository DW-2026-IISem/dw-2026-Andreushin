import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { registerSequelizeModel } from '../../../../../../infrastructure/database/sequelize/sequelize-model.registry.js';
import { MaterialModel } from '../../../../materials/infrastructure/persistence/models/material.model.js';

@Table({ tableName: 'products', timestamps: true })
export class ProductModel extends Model {
  @Column({ type: DataType.STRING(150), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare brand: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare minStock: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare quantity: number;

  @ForeignKey(() => MaterialModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare materialId: number;

  @BelongsTo(() => MaterialModel)
  declare material?: MaterialModel;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;
}

registerSequelizeModel(ProductModel);
