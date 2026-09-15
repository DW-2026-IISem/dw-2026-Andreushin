import { Inject, Injectable } from '@nestjs/common';
import { Op, Transaction } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE } from '../../../../../../infrastructure/database/sequelize/sequelize.module.js';
import { MaterialRateModel } from '../../../../material-rates/infrastructure/persistence/models/material-rate.model.js';
import { WeighingEntity } from '../../../domain/entities/weighing.entity.js';
import { SettlementEntity } from '../../../domain/entities/settlement.entity.js';
import { NoActiveRateForMaterialException } from '../../../domain/exceptions/no-active-rate-for-material.exception.js';
import { SettlementCalculator } from '../../../domain/services/settlement-calculator.js';
import type {
  CreateSettlementData,
  ISettlementRepository,
} from '../../../domain/interfaces/settlement.repository.interface.js';
import { SettlementModel } from '../models/settlement.model.js';
import { WeighingModel } from '../models/weighing.model.js';

const SETTLEMENT_STATUS_EMITTED = 'EMITIDA';

/**
 * Implementación concreta de `ISettlementRepository` usando Sequelize.
 *
 * `create` envuelve toda la operación en una única transacción
 * (`sequelize.transaction`): por cada pesaje bloquea la fila de la tarifa
 * activa del material (`LOCK.UPDATE`), calcula el pesaje con la entidad
 * pura `WeighingEntity` (que lanza `InvalidWeightException` si la tara es
 * inválida — INV-01), incrementa el `stockKg` acumulado de esa tarifa y
 * solo si todos los pesajes se procesan sin error inserta la cabecera
 * (`SettlementModel`) y el detalle (`WeighingModel`). Cualquier excepción
 * revierte la transacción completa (rollback total), incluyendo el stock
 * ya acumulado de pesajes anteriores dentro de la misma liquidación.
 */
@Injectable()
export class SettlementRepository implements ISettlementRepository {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async create(data: CreateSettlementData): Promise<SettlementEntity> {
    return this.sequelize.transaction(async (t) => {
      const weighings: WeighingEntity[] = [];
      const now = new Date();
      const dateOnly = now.toISOString().slice(0, 10);

      for (const item of data.items) {
        const rateModel = await MaterialRateModel.findOne({
          where: {
            materialId: item.materialId,
            isActive: true,
            startDate: { [Op.lte]: dateOnly },
            [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: dateOnly } }],
          },
          order: [['startDate', 'DESC']],
          transaction: t,
          lock: Transaction.LOCK.UPDATE,
        });

        if (!rateModel) {
          throw new NoActiveRateForMaterialException(item.materialId);
        }

        const weighing = new WeighingEntity(
          0,
          0,
          item.materialId,
          item.grossWeight,
          item.tareWeight,
          Number(rateModel.pricePerKg),
        );

        await rateModel.update(
          { stockKg: Number(rateModel.stockKg) + weighing.netWeight },
          { transaction: t },
        );

        weighings.push(weighing);
      }

      const subtotal = SettlementCalculator.calculateSubtotal(weighings);
      const total = SettlementCalculator.calculateTotal(subtotal, data.tax, data.discounts);

      const settlementModel = await SettlementModel.create(
        {
          recyclerId: data.recyclerId,
          settlementDate: now,
          subtotal,
          tax: data.tax,
          discounts: data.discounts,
          total,
          status: SETTLEMENT_STATUS_EMITTED,
        },
        { transaction: t },
      );

      const itemModels: WeighingModel[] = [];

      for (const weighing of weighings) {
        const itemModel = await WeighingModel.create(
          {
            settlementId: settlementModel.id,
            materialId: weighing.materialId,
            grossWeight: weighing.grossWeight,
            tareWeight: weighing.tareWeight,
            netWeight: weighing.netWeight,
            pricePerKg: weighing.pricePerKg,
            total: weighing.total,
          },
          { transaction: t },
        );
        itemModels.push(itemModel);
      }

      return this.toDomain(settlementModel, itemModels);
    });
  }

  async findById(id: number): Promise<SettlementEntity | null> {
    const settlementModel = await SettlementModel.findByPk(id);

    if (!settlementModel) {
      return null;
    }

    const itemModels = await WeighingModel.findAll({ where: { settlementId: id } });
    return this.toDomain(settlementModel, itemModels);
  }

  private toDomain(
    settlementModel: SettlementModel,
    itemModels: WeighingModel[],
  ): SettlementEntity {
    const items = itemModels.map(
      (item) =>
        new WeighingEntity(
          item.id,
          item.settlementId,
          item.materialId,
          Number(item.grossWeight),
          Number(item.tareWeight),
          Number(item.pricePerKg),
        ),
    );

    return new SettlementEntity(
      settlementModel.id,
      settlementModel.recyclerId,
      settlementModel.settlementDate,
      Number(settlementModel.subtotal),
      Number(settlementModel.tax),
      Number(settlementModel.discounts),
      Number(settlementModel.total),
      settlementModel.status as SettlementEntity['status'],
      items,
    );
  }
}
