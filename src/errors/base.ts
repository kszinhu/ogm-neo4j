import { ErrorConstructorParams } from ".";

export class OGMError extends Error {
  constructor({ cause, message, stack }: ErrorConstructorParams) {
    super(message ?? "OGM error");
    this.stack = stack;
    this.cause = cause;
  }
}
