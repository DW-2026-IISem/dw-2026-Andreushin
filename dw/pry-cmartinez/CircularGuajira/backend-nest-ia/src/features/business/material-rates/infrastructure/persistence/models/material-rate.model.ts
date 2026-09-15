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

@Table({ tableName: 'material_rates', timestamps: true })
export class MaterialRateModel extends Model {
  @ForeignKey(() => MaterialModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare materialId: number;

  @BelongsTo(() => MaterialModel)
  declare material?: MaterialModel;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare pricePerKg: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare minStockKg: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare stockKg: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare startDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare endDate: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;
}

registerSequelizeModel(MaterialRateModel);
