import Property from "@models/property";
import { int as castToInt } from "neo4j-driver";

export function castValues(property: Property<any>, value: any) {
  if (property.isInteger() && value !== null && value !== undefined) {
    value = castToInt(value);
  }

  return value;
}
