import { Module } from '@nestjs/common';
import { LoggingMiddleware } from './logging.middleware.js';

@Module({
  providers: [LoggingMiddleware],
  exports: [LoggingMiddleware],
})
export class LoggingModule {}
