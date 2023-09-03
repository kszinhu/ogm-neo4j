interface ErrorConstructorParams {
  cause: string;
  message?: string;
  stack?: string;
}

export default class TransactionError extends Error {
  name = "TRANSACTION_ERROR";

  constructor({ cause, message, stack }: ErrorConstructorParams) {
    super(message ? (message as string) : "Transaction error", {
      cause,
    });

    this.stack = stack;
  }
}
