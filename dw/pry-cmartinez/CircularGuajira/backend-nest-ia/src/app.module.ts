import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { EnvironmentConfigModule } from './config/environment/env.config.js';
import { BusinessModule } from './features/business/business.module.js';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module.js';

@Module({
  imports: [EnvironmentConfigModule, SequelizeDatabaseModule, BusinessModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
