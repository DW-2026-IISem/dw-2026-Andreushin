import { Module } from '@nestjs/common';
import { MaterialsModule } from '../materials/materials.module.js';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case.js';
import { FindAllProductsUseCase } from './application/use-cases/find-all-products.use-case.js';
import { FindProductByIdUseCase } from './application/use-cases/find-product-by-id.use-case.js';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case.js';
import { PRODUCT_REPOSITORY } from './domain/interfaces/product.repository.interface.js';
import { ProductRepository } from './infrastructure/persistence/repositories/product.repository.js';
import { ProductSeeder } from './infrastructure/persistence/seeders/product.seeder.js';
import { ProductsController } from './presentation/http/controllers/products.controller.js';

@Module({
  imports: [MaterialsModule],
  controllers: [ProductsController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: ProductRepository },
    CreateProductUseCase,
    FindAllProductsUseCase,
    FindProductByIdUseCase,
    UpdateProductUseCase,
    ProductSeeder,
  ],
  exports: [PRODUCT_REPOSITORY, ProductSeeder],
})
export class ProductsModule {}
