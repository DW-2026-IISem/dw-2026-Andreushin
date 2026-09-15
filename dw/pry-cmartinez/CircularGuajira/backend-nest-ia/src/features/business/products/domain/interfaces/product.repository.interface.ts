import type { ProductEntity } from '../entities/product.entity.js';

/**
 * Token de inyección de dependencias del puerto `IProductRepository`.
 * Un `Symbol` es una construcción nativa de TypeScript, no un import de
 * framework: puede vivir en el dominio sin violar la regla de pureza.
 */
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface CreateProductData {
  name: string;
  brand: string | null;
  price: number;
  minStock: number;
  quantity: number;
  materialId: number;
  isActive: boolean;
}

export interface UpdateProductData {
  name?: string;
  brand?: string;
  price?: number;
  minStock?: number;
  quantity?: number;
  materialId?: number;
  isActive?: boolean;
}

export interface FindAllProductsParams {
  page: number;
  limit: number;
}

export interface FindAllProductsResult {
  items: ProductEntity[];
  total: number;
}

/**
 * Puerto de persistencia del feature `products`. Definido en el dominio e
 * implementado por la capa de infraestructura (`ProductRepository`).
 */
export interface IProductRepository {
  create(data: CreateProductData): Promise<ProductEntity>;
  findAll(params: FindAllProductsParams): Promise<FindAllProductsResult>;
  findById(id: number): Promise<ProductEntity | null>;
  update(id: number, data: UpdateProductData): Promise<ProductEntity>;
  count(): Promise<number>;
}
