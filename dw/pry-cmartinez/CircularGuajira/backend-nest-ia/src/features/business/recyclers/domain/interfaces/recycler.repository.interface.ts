import type { RecyclerEntity } from '../entities/recycler.entity.js';

/**
 * Token de inyección de dependencias del puerto `IRecyclerRepository`.
 * Un `Symbol` es una construcción nativa de TypeScript, no un import de
 * framework: puede vivir en el dominio sin violar la regla de pureza.
 */
export const RECYCLER_REPOSITORY = Symbol('RECYCLER_REPOSITORY');

export interface CreateRecyclerData {
  documentNumber: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface UpdateRecyclerData {
  documentNumber?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface FindAllRecyclersParams {
  page: number;
  limit: number;
}

export interface FindAllRecyclersResult {
  items: RecyclerEntity[];
  total: number;
}

/**
 * Puerto de persistencia del feature `recyclers`. Definido en el dominio e
 * implementado por la capa de infraestructura (`RecyclerRepository`).
 */
export interface IRecyclerRepository {
  create(data: CreateRecyclerData): Promise<RecyclerEntity>;
  findAll(params: FindAllRecyclersParams): Promise<FindAllRecyclersResult>;
  findById(id: number): Promise<RecyclerEntity | null>;
  findByDocumentNumber(documentNumber: string): Promise<RecyclerEntity | null>;
  update(id: number, data: UpdateRecyclerData): Promise<RecyclerEntity>;
}
