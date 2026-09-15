import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { registerSequelizeModel } from '../../../../../../infrastructure/database/sequelize/sequelize-model.registry.js';
import { RecyclerModel } from '../../../../recyclers/infrastructure/persistence/models/recycler.model.js';

@Table({ tableName: 'settlements', timestamps: false })
export class SettlementModel extends Model {
  @ForeignKey(() => RecyclerModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare recyclerId: number;

  @BelongsTo(() => RecyclerModel)
  declare recycler?: RecyclerModel;

  @Column({ type: DataType.DATE, allowNull: false })
  declare settlementDate: Date;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare subtotal: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare tax: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare discounts: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare total: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'EMITIDA' })
  declare status: string;
}

registerSequelizeModel(SettlementModel);
