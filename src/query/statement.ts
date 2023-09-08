import Property from "./sections/property.js";
import Match from "./sections/match.js";
import WhereStatement from "./statements/where.js";
import Order from "./sections/order.js";
import Relationship from "./sections/relationship.js";

import type { PropertyRelationSchema } from "../types/models.js";
import type { DirectionTypes } from "../types/lexer.js";
import RawStatement from "./statements/raw.js";

export interface PropertyRelation {
  name: string;
  direction: Uppercase<DirectionTypes>;
}

class Statement {
  #prefix: string;
  #patterns: (Match | Relationship)[] = [];
  #where: (WhereStatement | RawStatement)[] = [];
  #order: Order[] = [];
  #detachDelete: string[] = [];
  #return: string[] = [];
  #set: Property[] = [];
  #onCreateSet: Property[] = [];
  #onMatchSet: Property[] = [];
  #remove: string[] = [];
  #delete: string[] = [];
  #limit: string | null = null;
  #skip: string | null = null;

  constructor(prefix = "MATCH") {
    this.#prefix = prefix;
  }

  match(pattern: Match) {
    this.#patterns.push(pattern);

    return this;
  }

  delete(...values: string[]) {
    this.#delete.push(...values);

    return this;
  }

  where(
    condition: WhereStatement | RawStatement | (WhereStatement | RawStatement)[]
  ) {
    this.#where.push(...(Array.isArray(condition) ? condition : [condition]));

    return this;
  }

  limit(limit: number) {
    this.#limit = limit.toString();

    return this;
  }

  skip(skip: number) {
    this.#skip = skip.toString();

    return this;
  }

  order(order: Order) {
    this.#order.push(order);

    return this;
  }

  detachDelete(...variables: string[]) {
    this.#detachDelete.push(...variables);

    return this;
  }

  return(...variables: string[]) {
    this.#return.push(...variables);

    return this;
  }

  relationship(relationship: PropertyRelation, alias: string) {
    const { name, direction } = relationship;
    this.#patterns.push(new Relationship(name, alias, direction));

    return this;
  }

  set(name: string, value: any, operator: string) {
    this.#set.push(new Property(name, value, operator));

    return this;
  }

  onCreateSet(name: string, value: any, operator: string) {
    this.#onCreateSet.push(new Property(name, value, operator));

    return this;
  }

  onMatchSet(name: string, value: any, operator: string) {
    this.#onMatchSet.push(new Property(name, value, operator));

    return this;
  }

  remove(items: string[]) {
    this.#remove.push(...items);

    return this;
  }

  toString(includePrefix = true) {
    const statements = [
      `${includePrefix ? this.#prefix : ""} ${this.#patterns.join(", ")}`,
      this.#where.length ? `WHERE ${this.#where.join(" AND ")}` : "",
      this.#order.length ? `ORDER BY ${this.#order.join(", ")}` : "",
      this.#detachDelete.length
        ? `DETACH DELETE ${this.#detachDelete.join(", ")}`
        : "",
      this.#return.length ? `RETURN ${this.#return.join(", ")}` : "",
      this.#set.length ? `SET ${this.#set.join(", ")}` : "",
      this.#onCreateSet.length
        ? `ON CREATE SET ${this.#onCreateSet.join(", ")}`
        : "",
      this.#onMatchSet.length
        ? `ON MATCH SET ${this.#onMatchSet.join(", ")}`
        : "",
      this.#remove.length ? `REMOVE ${this.#remove.join(", ")}` : "",
      this.#limit ? `LIMIT ${this.#limit}` : "",
      this.#skip ? `SKIP ${this.#skip}` : "",
    ];

    return statements.filter((statement) => !!statement).join("\n");
  }
}

export default Statement;
