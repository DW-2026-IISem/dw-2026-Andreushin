import { Module } from '@nestjs/common';
import { MaterialsModule } from './materials/materials.module.js';
import { ProductsModule } from './products/products.module.js';
import { RecyclersModule } from './recyclers/recyclers.module.js';

@Module({
  imports: [RecyclersModule, MaterialsModule, ProductsModule],
})
export class BusinessModule {}
