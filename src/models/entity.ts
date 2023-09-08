import { Integer } from "neo4j-driver";
import { valueToJSON } from "@utils/index.js";

class Entity<T extends Record<string, any>> {
  protected _id: number;
  protected _identity: Integer;
  protected _properties: Map<keyof T, T[keyof T]>;

  constructor(identity: Integer, properties: Map<keyof T, T[keyof T]>) {
    this._identity = identity;
    this._properties = properties;
    this._id = identity.toNumber();
  }

  get id() {
    return this._id;
  }

  get identity() {
    return this._identity;
  }

  get(property: keyof T, or?: any) {
    if (this._properties.has(property)) return this._properties.get(property);

    return or || null;
  }

  valueToJSON(value: any) {
    return valueToJSON(value);
  }
}

export default Entity;
