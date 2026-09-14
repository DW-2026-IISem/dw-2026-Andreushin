import type { RecyclerEntity } from '../../domain/entities/recycler.entity.js';
import type { CreateRecyclerData } from '../../domain/interfaces/recycler.repository.interface.js';
import type { CreateRecyclerDto } from '../dto/create-recycler.dto.js';
import type { RecyclerResponseDto } from '../dto/recycler-response.dto.js';

/**
 * Mapeador bidireccional entre la entidad de dominio `RecyclerEntity` y los
 * DTOs de presentación (`CreateRecyclerDto` de entrada, `RecyclerResponseDto`
 * de salida). El mapeo Entidad <-> Modelo Sequelize vive en el repositorio
 * de infraestructura, para no acoplar la capa de aplicación a Sequelize.
 */
export class RecyclerMapper {
  static toCreateData(dto: CreateRecyclerDto): CreateRecyclerData {
    return {
      documentNumber: dto.documentNumber,
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
    };
  }

  static toResponseDto(entity: RecyclerEntity): RecyclerResponseDto {
    return {
      id: entity.id,
      documentNumber: entity.documentNumber,
      name: entity.name,
      phone: entity.phone,
      email: entity.email,
      address: entity.address,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
