import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { LoggingModule } from './logging/logging.module.js';
import { LoggingMiddleware } from './logging/logging.middleware.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [ConfigModule, DatabaseModule, LoggingModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
