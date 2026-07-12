// Base application error carrying an HTTP status. Every thrown error the API/actions
// surface should extend this so errorHandler can map it to a clean response.
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
  }
}
