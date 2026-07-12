import { AppError } from "./AppError";

// A domain/business-rule violation with a user-facing message and an HTTP status
// (409 conflict / 422 unprocessable / 403 forbidden, per the rule). The plan's
// service-layer code refers to this as `DomainError`; both names point here.
export class BusinessRuleError extends AppError {
  constructor(statusCode: number, message: string) {
    super(message, statusCode);
  }
}

export { BusinessRuleError as DomainError };
