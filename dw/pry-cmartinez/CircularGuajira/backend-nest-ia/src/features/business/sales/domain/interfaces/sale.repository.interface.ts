import type { SaleEntity } from '../entities/sale.entity.js';

/**
 * Token de inyección de dependencias del puerto `ISaleRepository`.
 * Un `Symbol` es una construcción nativa de TypeScript, no un import de
 * framework: puede vivir en el dominio sin violar la regla de pureza.
 */
export const SALE_REPOSITORY = Symbol('SALE_REPOSITORY');

export interface CreateSaleItemData {
  productId: number;
  quantity: number;
  /** Si no se envía, la infraestructura la resuelve al precio actual del producto dentro de la transacción. */
  unitPrice?: number;
}

export interface CreateSaleData {
  clientId: number;
  items: CreateSaleItemData[];
  tax: number;
  discounts: number;
}

/**
 * Puerto de persistencia del feature `sales`. Definido en el dominio e
 * implementado por la capa de infraestructura (`SaleRepository`), que
 * envuelve `create` en una transacción atómica de Sequelize.
 */
export interface ISaleRepository {
  create(data: CreateSaleData): Promise<SaleEntity>;
  findById(id: number): Promise<SaleEntity | null>;
}
