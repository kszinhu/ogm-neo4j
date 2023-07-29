class TransactionError extends Error {
  errors: any[];

  constructor(errors: any[]) {
    super("Transaction failed");
    this.errors = errors;
  }
}
