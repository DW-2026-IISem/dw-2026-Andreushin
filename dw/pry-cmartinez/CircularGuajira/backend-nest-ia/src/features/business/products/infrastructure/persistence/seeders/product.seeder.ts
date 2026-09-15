import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../../../materials/domain/interfaces/material.repository.interface.js';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../../domain/interfaces/product.repository.interface.js';

const DEMO_MATERIAL_NAME = 'PET';
const DEMO_PRODUCT = {
  name: 'Lote PET Transparente',
  brand: null,
  price: 1500,
  minStock: 10,
  quantity: 100,
};

/**
 * Seeder idempotente del feature `products`: `products` no tiene un campo
 * único de negocio (a diferencia de `recyclers`/`materials`), así que la
 * idempotencia se verifica con `count()` — si ya existe al menos un
 * producto, se omite la siembra demo.
 */
@Injectable()
export class ProductSeeder {
  private readonly logger = new Logger(ProductSeeder.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async seed(): Promise<void> {
    const existingCount = await this.productRepository.count();

    if (existingCount > 0) {
      this.logger.log('Ya existen productos, se omite la siembra demo');
      return;
    }

    const material = await this.materialRepository.findByName(DEMO_MATERIAL_NAME);

    if (!material || !material.isActive) {
      this.logger.warn(
        `No se encontró un material activo "${DEMO_MATERIAL_NAME}" para sembrar el producto demo; se omite`,
      );
      return;
    }

    await this.productRepository.create({
      ...DEMO_PRODUCT,
      materialId: material.id,
      isActive: true,
    });
    this.logger.log(`Producto demo sembrado: ${DEMO_PRODUCT.name} (material: ${material.name})`);
  }
}
