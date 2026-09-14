/**
 * Excepción base de la aplicación. Toda excepción de negocio/dominio del
 * backend debe extender de esta clase para ser reconocida por el
 * `GlobalExceptionFilter` y mapeada a un código de estado HTTP.
 */
export class ApplicationException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
