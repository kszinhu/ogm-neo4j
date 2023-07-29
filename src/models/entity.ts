import { Integer } from "neo4j-driver";
import { valueToJSON } from "src/utils";

class Entity<T extends Record<string, any>> {
  private _id: number;
  private _identity: Integer;
  private _properties: Map<keyof T, T[keyof T]>;

  constructor(identity: Integer, properties: Map<keyof T, T[keyof T]>) {
    this._identity = identity;
    this._properties = properties;
    this._id = identity.toNumber();
  }

  id() {
    return this._id;
  }

  identity() {
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
