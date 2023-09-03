export default class ValidationError extends Error {
  errors: any[];
  name = "VALIDATION_ERROR";

  constructor(errors: any[]) {
    super("Validation error", { cause: errors });
    this.errors = errors;
  }
}
