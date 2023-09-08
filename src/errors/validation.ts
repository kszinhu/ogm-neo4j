export default class ValidationError extends Error {
  errors: any[];
  name = "VALIDATION_ERROR";

  constructor(errors: any[]) {
    super("Validation error");
    this.errors = errors;
  }
}
