export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}

// No valid identity: missing, invalid or expired token, or inactive user.
export class UnauthorizedError extends HttpError {
  constructor(message = "Autenticación requerida") {
    super(401, message);
  }
}

// Valid identity without an active grant for the operation (deny by default).
export class ForbiddenError extends HttpError {
  constructor(message = "No tienes permiso para esta operación") {
    super(403, message);
  }
}
