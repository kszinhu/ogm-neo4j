import { OGMError } from "./base";

export default class ValidationError extends OGMError {
  name = "VALIDATION_ERROR";
}
