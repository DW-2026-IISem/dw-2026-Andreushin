import type { MaterialEntity } from '../../domain/entities/material.entity.js';
import type { CreateMaterialData } from '../../domain/interfaces/material.repository.interface.js';
import type { CreateMaterialDto } from '../dto/create-material.dto.js';
import type { MaterialResponseDto } from '../dto/material-response.dto.js';

const DEFAULT_UNIT_OF_MEASURE = 'KG';

/**
 * Mapeador bidireccional entre la entidad de dominio `MaterialEntity` y los
 * DTOs de presentación (`CreateMaterialDto` de entrada, `MaterialResponseDto`
 * de salida). El mapeo Entidad <-> Modelo Sequelize vive en el repositorio
 * de infraestructura, para no acoplar la capa de aplicación a Sequelize.
 */
export class MaterialMapper {
  static toCreateData(dto: CreateMaterialDto): CreateMaterialData {
    return {
      name: dto.name,
      description: dto.description ?? null,
      unitOfMeasure: dto.unitOfMeasure ?? DEFAULT_UNIT_OF_MEASURE,
    };
  }

  static toResponseDto(entity: MaterialEntity): MaterialResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      unitOfMeasure: entity.unitOfMeasure,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
