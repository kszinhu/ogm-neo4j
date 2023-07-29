import { Integer } from "neo4j-driver";
import Entity from "./entity";

class Relationship<T extends Record<string, any>> extends Entity<T> {
  #deleted: boolean = false;

  constructor(identity: Integer, properties: Map<keyof T, T[keyof T]>) {
    super(identity, properties);

    this.#deleted = false;
  }

  update(properties: Partial<T>) {
    throw new Error("Not implemented");
  }

  delete() {
    throw new Error("Not implemented");
  }

  toJson() {
    throw new Error("Not implemented");
  }
}

export default Relationship;
