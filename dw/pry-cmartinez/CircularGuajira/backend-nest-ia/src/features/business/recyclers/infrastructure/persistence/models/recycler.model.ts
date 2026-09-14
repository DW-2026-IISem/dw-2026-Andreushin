import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { registerSequelizeModel } from '../../../../../../infrastructure/database/sequelize/sequelize-model.registry.js';

@Table({ tableName: 'recyclers', timestamps: true })
export class RecyclerModel extends Model {
  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  declare documentNumber: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(30), allowNull: true })
  declare phone: string | null;

  @Column({ type: DataType.STRING(150), allowNull: true })
  declare email: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare address: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;
}

registerSequelizeModel(RecyclerModel);
