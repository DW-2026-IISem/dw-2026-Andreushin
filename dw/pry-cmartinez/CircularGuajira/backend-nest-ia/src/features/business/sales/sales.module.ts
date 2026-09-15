import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { RecyclersModule } from '../recyclers/recyclers.module.js';
import { CreateSaleUseCase } from './application/use-cases/create-sale.use-case.js';
import { GetSaleByIdUseCase } from './application/use-cases/get-sale-by-id.use-case.js';
import { SALE_REPOSITORY } from './domain/interfaces/sale.repository.interface.js';
import { SaleRepository } from './infrastructure/persistence/repositories/sale.repository.js';
import { SalesController } from './presentation/http/controllers/sales.controller.js';

@Module({
  imports: [RecyclersModule, ProductsModule],
  controllers: [SalesController],
  providers: [
    { provide: SALE_REPOSITORY, useClass: SaleRepository },
    CreateSaleUseCase,
    GetSaleByIdUseCase,
  ],
  exports: [SALE_REPOSITORY],
})
export class SalesModule {}
