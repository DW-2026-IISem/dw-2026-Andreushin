import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApplicationException } from '../exceptions/application.exception.js';

interface ResolvedError {
  statusCode: number;
  message: string;
}

/**
 * Filtro global de excepciones. Captura toda excepción lanzada por la app
 * (ApplicationException y sus subclases, HttpException de Nest, o
 * cualquier error no controlado) y la formatea en la salida JSON estándar
 * `{ statusCode, message, timestamp }`.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, message } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof ApplicationException) {
      return { statusCode: exception.statusCode, message: exception.message };
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const rawMessage =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ??
            exception.message);

      return {
        statusCode: exception.getStatus(),
        message: Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    };
  }
}
