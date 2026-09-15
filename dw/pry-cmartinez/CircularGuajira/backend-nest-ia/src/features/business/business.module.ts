import { Module } from '@nestjs/common';
import { MaterialsModule } from './materials/materials.module.js';
import { RecyclersModule } from './recyclers/recyclers.module.js';

@Module({
  imports: [RecyclersModule, MaterialsModule],
})
export class BusinessModule {}
