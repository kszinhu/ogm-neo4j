import { Integer } from "neo4j-driver";
import Entity from "./entity.js";
import { PropertySchema as Property } from "src/types/models.js";

class Node<T extends Record<string, Property>> extends Entity<T> {
  #labels: string[];
  #deleted: boolean = false;

  constructor(
    identity: Integer,
    labels: string[],
    properties: Map<keyof T, T[keyof T]>
  ) {
    super(identity, properties);

    this.#labels = labels;
    this.#deleted = false;
  }

  /**
   * Get the labels of this node.
   */
  labels() {
    return this.#labels;
  }

  update(properties: Partial<T>) {
    throw new Error("Not implemented");
  }

  /**
   * Delete this node from the database.
   */
  delete() {
    throw new Error("Not implemented");
  }

  /**
   * Detach this node from another node.
   */
  detachFrom(other: Node<any>) {
    throw new Error("Not implemented");
  }

  /**
   * Convert this node to a friendly JSON format.
   */
  toJSON(): Promise<string> {
    throw new Error("Not implemented");
  }
}

export default Node;
