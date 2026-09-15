import { Module } from '@nestjs/common';
import { MaterialRatesModule } from './material-rates/material-rates.module.js';
import { MaterialsModule } from './materials/materials.module.js';
import { RecyclersModule } from './recyclers/recyclers.module.js';
import { SettlementsModule } from './settlements/settlements.module.js';

@Module({
  imports: [RecyclersModule, MaterialsModule, MaterialRatesModule, SettlementsModule],
})
export class BusinessModule {}
