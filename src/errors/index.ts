export interface ErrorConstructorParams {
  cause: string;
  message: string;
  stack?: string;
}

export { default as TransactionError } from "./transaction";
export { default as ValidationError } from "./validation";
export { default as SchemaError } from "./schema";
export { default as EntityError } from "./entity";
export { default as ModelError } from "./model";
export { OGMError } from "./base";
