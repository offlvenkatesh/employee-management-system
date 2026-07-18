import { ZodError } from "zod";

export interface FieldError {
  path: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: FieldError[]
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(details: FieldError[]) {
    super("Validation failed", "VALIDATION_ERROR", 422, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, "BAD_REQUEST", 400);
  }
}

export function fromZodError(error: ZodError): ValidationError {
  return new ValidationError(
    error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }))
  );
}
