import { Integer } from "neo4j-driver";
import Entity from "./entity.js";
import OGM from "@app/app.js";
import Model from "./model.js";
import Node from "./node.js";

interface RelationshipConstructor<T extends Record<string, any>> {
  identity: Integer;
  name: string;
  app: OGM;
  relationSchema: Record<string, any>; // TODO: Define schema type
  properties: Map<keyof T, T[keyof T]>;
}

class Relationship<T extends Record<string, any>> extends Entity<T> {
  #app: OGM;
  #name: string;
  #schema: Record<string, any>; // TODO: Define schema type
  #from: Node<any>;
  #to: Node<any>;

  constructor({
    app,
    identity,
    name,
    relationSchema: schema,
    properties,
  }: RelationshipConstructor<T>) {
    super(identity, properties);

    this.#app = app;
    this.#name = name;
    this.#schema = schema;
    this.#from = schema.from;
    this.#to = schema.to;
  }

  get name() {
    return this.#name;
  }

  get from() {
    return this.#from;
  }

  get to() {
    return this.#to;
  }

  otherNode() {
    return this.#schema.direction === "DIRECTION_IN" ? this.#from : this.#to;
  }

  update(properties: Partial<T>) {
    throw new Error("Not implemented");
  }

  delete() {
    throw new Error("Not implemented");
  }

  toJson() {
    const output = {
      _id: this._id,
      _identity: this._identity,
    };

    this._properties.forEach((property, key) => {
      if (property.hidden()) return;

      if (this._properties.has(key)) {
        output[key as keyof typeof output] = this.valueToJSON(
          this._properties.get(key)
        );
      }
    });

    return this.otherNode()
      .toJSON()
      .then((json) => {
        output[this.#name] = json;
      });
  }
}

export default Relationship;
