import type { MaterialRateEntity } from '../../domain/entities/material-rate.entity.js';
import type { CreateMaterialRateData } from '../../domain/interfaces/material-rate.repository.interface.js';
import type { CreateMaterialRateDto } from '../dto/create-material-rate.dto.js';
import type { MaterialRateResponseDto } from '../dto/material-rate-response.dto.js';

const DEFAULT_MIN_STOCK_KG = 0;
const DEFAULT_STOCK_KG = 0;
const DEFAULT_IS_ACTIVE = true;

/**
 * Mapeador bidireccional entre la entidad de dominio `MaterialRateEntity` y
 * los DTOs de presentación. Los valores por defecto (`minStockKg`,
 * `stockKg`, `isActive`) se resuelven aquí, no a nivel de DTO, igual que en
 * `RecyclerMapper`/`MaterialMapper`/`ProductMapper`.
 */
export class MaterialRateMapper {
  static toCreateData(dto: CreateMaterialRateDto): CreateMaterialRateData {
    return {
      materialId: dto.materialId,
      pricePerKg: dto.pricePerKg,
      minStockKg: dto.minStockKg ?? DEFAULT_MIN_STOCK_KG,
      stockKg: dto.stockKg ?? DEFAULT_STOCK_KG,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      isActive: DEFAULT_IS_ACTIVE,
    };
  }

  static toResponseDto(entity: MaterialRateEntity): MaterialRateResponseDto {
    return {
      id: entity.id,
      materialId: entity.materialId,
      pricePerKg: entity.pricePerKg,
      minStockKg: entity.minStockKg,
      stockKg: entity.stockKg,
      startDate: entity.startDate,
      endDate: entity.endDate,
      isActive: entity.isActive,
    };
  }
}
