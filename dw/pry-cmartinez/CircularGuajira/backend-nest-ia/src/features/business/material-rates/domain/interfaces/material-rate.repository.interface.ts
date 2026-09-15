import type { MaterialRateEntity } from '../entities/material-rate.entity.js';

/**
 * Token de inyección de dependencias del puerto `IMaterialRateRepository`.
 * Un `Symbol` es una construcción nativa de TypeScript, no un import de
 * framework: puede vivir en el dominio sin violar la regla de pureza.
 */
export const MATERIAL_RATE_REPOSITORY = Symbol('MATERIAL_RATE_REPOSITORY');

export interface CreateMaterialRateData {
  materialId: number;
  pricePerKg: number;
  minStockKg: number;
  stockKg: number;
  /** Fecha calendario en formato ISO `YYYY-MM-DD` (sin componente de hora/zona horaria). */
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface FindAllMaterialRatesParams {
  page: number;
  limit: number;
}

export interface FindAllMaterialRatesResult {
  items: MaterialRateEntity[];
  total: number;
}

/**
 * Puerto de persistencia del feature `material-rates`. Definido en el
 * dominio e implementado por la capa de infraestructura
 * (`MaterialRateRepository`).
 */
export interface IMaterialRateRepository {
  create(data: CreateMaterialRateData): Promise<MaterialRateEntity>;
  findAll(params: FindAllMaterialRatesParams): Promise<FindAllMaterialRatesResult>;
  findById(id: number): Promise<MaterialRateEntity | null>;
  /** Tarifa activa vigente para un material en una fecha dada (rango [startDate, endDate] inclusive, endDate null = indefinida). */
  findActiveRateByMaterialAndDate(
    materialId: number,
    date: Date,
  ): Promise<MaterialRateEntity | null>;
  count(): Promise<number>;
}
