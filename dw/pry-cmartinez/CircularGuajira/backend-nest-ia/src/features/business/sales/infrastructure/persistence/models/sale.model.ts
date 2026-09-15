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

@Table({ tableName: 'sales', timestamps: false })
export class SaleModel extends Model {
  @Column({ type: DataType.DATE, allowNull: false })
  declare saleDate: Date;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare subtotal: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare tax: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare discounts: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare total: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'COMPLETED' })
  declare status: string;

  @ForeignKey(() => RecyclerModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @BelongsTo(() => RecyclerModel)
  declare client?: RecyclerModel;
}

registerSequelizeModel(SaleModel);
