import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { registerSequelizeModel } from '../../../../../../infrastructure/database/sequelize/sequelize-model.registry.js';

@Table({ tableName: 'materials', timestamps: true })
export class MaterialModel extends Model {
  @Column({ type: DataType.STRING(150), allowNull: false, unique: true })
  declare name: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'KG' })
  declare unitOfMeasure: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;
}

registerSequelizeModel(MaterialModel);
