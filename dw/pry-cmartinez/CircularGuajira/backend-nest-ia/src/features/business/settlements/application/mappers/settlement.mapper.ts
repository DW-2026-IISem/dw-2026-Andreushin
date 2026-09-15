import type { SettlementEntity } from '../../domain/entities/settlement.entity.js';
import type { CreateSettlementData } from '../../domain/interfaces/settlement.repository.interface.js';
import type { CreateSettlementDto } from '../dto/create-settlement.dto.js';
import type { SettlementResponseDto } from '../dto/settlement-response.dto.js';

const DEFAULT_TAX = 0;
const DEFAULT_DISCOUNTS = 0;

/**
 * Mapeador bidireccional entre la entidad de dominio `SettlementEntity` y
 * los DTOs de presentación. Los valores por defecto (`tax`, `discounts`)
 * se resuelven aquí, no a nivel de DTO, igual que en el resto de features.
 * El cálculo de `netWeight`/`total` por pesaje ocurre en el repositorio,
 * dentro de la transacción, porque depende de la tarifa activa vigente en
 * ese momento (no es un dato que venga del DTO).
 */
export class SettlementMapper {
  static toCreateData(dto: CreateSettlementDto): CreateSettlementData {
    return {
      recyclerId: dto.recyclerId,
      items: dto.items.map((item) => ({
        materialId: item.materialId,
        grossWeight: item.grossWeight,
        tareWeight: item.tareWeight,
      })),
      tax: dto.tax ?? DEFAULT_TAX,
      discounts: dto.discounts ?? DEFAULT_DISCOUNTS,
    };
  }

  static toResponseDto(entity: SettlementEntity): SettlementResponseDto {
    return {
      id: entity.id,
      recyclerId: entity.recyclerId,
      settlementDate: entity.settlementDate,
      subtotal: entity.subtotal,
      tax: entity.tax,
      discounts: entity.discounts,
      total: entity.total,
      status: entity.status,
      items: entity.items.map((item) => ({
        id: item.id,
        materialId: item.materialId,
        grossWeight: item.grossWeight,
        tareWeight: item.tareWeight,
        netWeight: item.netWeight,
        pricePerKg: item.pricePerKg,
        total: item.total,
      })),
    };
  }
}
