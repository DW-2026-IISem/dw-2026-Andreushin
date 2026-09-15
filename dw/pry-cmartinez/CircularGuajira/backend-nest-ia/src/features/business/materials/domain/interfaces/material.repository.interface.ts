import type { MaterialEntity } from '../entities/material.entity.js';

/**
 * Token de inyección de dependencias del puerto `IMaterialRepository`.
 * Un `Symbol` es una construcción nativa de TypeScript, no un import de
 * framework: puede vivir en el dominio sin violar la regla de pureza.
 */
export const MATERIAL_REPOSITORY = Symbol('MATERIAL_REPOSITORY');

export interface CreateMaterialData {
  name: string;
  description: string | null;
  unitOfMeasure: string;
}

export interface UpdateMaterialData {
  name?: string;
  description?: string;
  unitOfMeasure?: string;
  isActive?: boolean;
}

export interface FindAllMaterialsParams {
  page: number;
  limit: number;
}

export interface FindAllMaterialsResult {
  items: MaterialEntity[];
  total: number;
}

/**
 * Puerto de persistencia del feature `materials`. Definido en el dominio e
 * implementado por la capa de infraestructura (`MaterialRepository`).
 */
export interface IMaterialRepository {
  create(data: CreateMaterialData): Promise<MaterialEntity>;
  findAll(params: FindAllMaterialsParams): Promise<FindAllMaterialsResult>;
  findById(id: number): Promise<MaterialEntity | null>;
  findByName(name: string): Promise<MaterialEntity | null>;
  update(id: number, data: UpdateMaterialData): Promise<MaterialEntity>;
  count(): Promise<number>;
}
