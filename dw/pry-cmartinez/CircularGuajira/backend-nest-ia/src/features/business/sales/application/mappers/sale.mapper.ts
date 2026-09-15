import type { SaleEntity } from '../../domain/entities/sale.entity.js';
import type { CreateSaleData } from '../../domain/interfaces/sale.repository.interface.js';
import type { CreateSaleDto } from '../dto/create-sale.dto.js';
import type { SaleResponseDto } from '../dto/sale-response.dto.js';

const DEFAULT_TAX = 0;
const DEFAULT_DISCOUNTS = 0;

/**
 * Mapeador bidireccional entre la entidad de dominio `SaleEntity` y los
 * DTOs de presentación (`CreateSaleDto` de entrada, `SaleResponseDto` de
 * salida). Los valores por defecto (`tax`, `discounts`) se resuelven aquí,
 * no a nivel de DTO, igual que en `RecyclerMapper`/`MaterialMapper`/
 * `ProductMapper`. La resolución de `unitPrice` cuando no viene en el item
 * (precio actual del producto) requiere acceso a datos y ocurre en el
 * repositorio, dentro de la transacción, no en este mapper.
 */
export class SaleMapper {
  static toCreateData(dto: CreateSaleDto): CreateSaleData {
    return {
      clientId: dto.clientId,
      items: dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      tax: dto.tax ?? DEFAULT_TAX,
      discounts: dto.discounts ?? DEFAULT_DISCOUNTS,
    };
  }

  static toResponseDto(entity: SaleEntity): SaleResponseDto {
    return {
      id: entity.id,
      saleDate: entity.saleDate,
      subtotal: entity.subtotal,
      tax: entity.tax,
      discounts: entity.discounts,
      total: entity.total,
      status: entity.status,
      clientId: entity.clientId,
      items: entity.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    };
  }
}
