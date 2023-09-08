import { int as castToInt } from "neo4j-driver";
import Property from "@models/property.js";

export function castValues(property: Property<any>, value: any) {
  if (property.isInteger() && value !== null && value !== undefined) {
    value = castToInt(value);
  }

  return value;
}
