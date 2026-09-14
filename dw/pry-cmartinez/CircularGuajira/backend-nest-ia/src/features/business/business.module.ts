import { Module } from '@nestjs/common';
import { RecyclersModule } from './recyclers/recyclers.module.js';

@Module({
  imports: [RecyclersModule],
})
export class BusinessModule {}
