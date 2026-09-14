import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from './application.exception.js';

/**
 * Violación de una regla básica de dominio o payload inválido a nivel de
 * negocio. Mapea a 400 Bad Request.
 */
export class DomainException extends ApplicationException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
