import type { ProductEntity } from '../../domain/entities/product.entity.js';
import type { CreateProductData } from '../../domain/interfaces/product.repository.interface.js';
import type { CreateProductDto } from '../dto/create-product.dto.js';
import type { ProductResponseDto } from '../dto/product-response.dto.js';

const DEFAULT_MIN_STOCK = 0;
const DEFAULT_QUANTITY = 0;
const DEFAULT_IS_ACTIVE = true;

/**
 * Mapeador bidireccional entre la entidad de dominio `ProductEntity` y los
 * DTOs de presentación (`CreateProductDto` de entrada, `ProductResponseDto`
 * de salida). Los valores por defecto (`minStock`, `quantity`, `isActive`)
 * se resuelven aquí, no a nivel de DTO, igual que `RecyclerMapper` y
 * `MaterialMapper`. El mapeo Entidad <-> Modelo Sequelize vive en el
 * repositorio de infraestructura.
 */
export class ProductMapper {
  static toCreateData(dto: CreateProductDto): CreateProductData {
    return {
      name: dto.name,
      brand: dto.brand ?? null,
      price: dto.price,
      minStock: dto.minStock ?? DEFAULT_MIN_STOCK,
      quantity: dto.quantity ?? DEFAULT_QUANTITY,
      materialId: dto.materialId,
      isActive: DEFAULT_IS_ACTIVE,
    };
  }

  static toResponseDto(entity: ProductEntity): ProductResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      brand: entity.brand,
      price: entity.price,
      minStock: entity.minStock,
      quantity: entity.quantity,
      materialId: entity.materialId,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
