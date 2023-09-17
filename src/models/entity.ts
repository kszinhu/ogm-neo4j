import { Integer } from "neo4j-driver";
import { valueToJSON } from "@utils/index";

class Entity<Schema extends Record<string, any>> {
  protected _id: number;
  protected _identity: Integer;
  protected _properties: Map<keyof Schema, Schema[keyof Schema]>;

  constructor(identity: Integer, properties: Schema) {
    this._identity = identity;
    this._properties = new Map(Object.entries(properties));
    this._id = identity.toNumber();
  }

  get id() {
    return this._id;
  }

  get identity() {
    return this._identity;
  }

  get(property: keyof Schema, or?: any) {
    if (this._properties.has(property)) return this._properties.get(property);

    return or || null;
  }

  valueToJSON(value: any) {
    return valueToJSON(value);
  }
}

export default Entity;
