import {
  type CallHandler,
  type ExecutionContext,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { type Observable, map } from 'rxjs';

export interface ResponseEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Envuelve toda respuesta HTTP exitosa en el sobre estándar
 * `{ statusCode, message, data, timestamp }` definido por el contrato de
 * arquitectura (docs/Prompt.md, sección 4).
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode ?? HttpStatus.OK,
        message: 'OK',
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
