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
import { SettlementModel } from './settlement.model.js';

@Table({ tableName: 'weighings', timestamps: false })
export class WeighingModel extends Model {
  @ForeignKey(() => SettlementModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare settlementId: number;

  @BelongsTo(() => SettlementModel)
  declare settlement?: SettlementModel;

  @ForeignKey(() => MaterialModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare materialId: number;

  @BelongsTo(() => MaterialModel)
  declare material?: MaterialModel;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare grossWeight: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare tareWeight: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare netWeight: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare pricePerKg: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare total: number;
}

registerSequelizeModel(WeighingModel);
