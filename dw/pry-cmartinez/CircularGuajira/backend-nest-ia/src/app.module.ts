import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { BusinessModule } from './features/business/business.module.js';

@Module({
  imports: [BusinessModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
