import Property from "../models/property";
import WhereStatement from "./statements/where";

class Statement {
  #prefix: string;
  #patterns: string[] = [];
  #where: WhereStatement[] = [];
  #order: string[] = [];
  #detachDelete: string[] = [];
  #return: string[] = [];
  #set: Property<any>[] = [];
  #onCreateSet: Property<any>[] = [];
  #onMatchSet: Property<any>[] = [];
  #remove: string[] = [];
  #limit: string | null = null;
  #skip: string | null = null;

  constructor(prefix = "MATCH") {
    this.#prefix = prefix;
  }

  match(pattern: string) {
    this.#patterns.push(pattern);

    return this;
  }

  where(condition: WhereStatement) {
    this.#where.push(condition);

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

  order(order: string) {
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

  set(name: string, value: any) {
    this.#set.push(new Property(name, value));

    return this;
  }

  onCreateSet(name: string, value: any) {
    this.#onCreateSet.push(new Property(name, value));

    return this;
  }

  onMatchSet(name: string, value: any) {
    this.#onMatchSet.push(new Property(name, value));

    return this;
  }

  remove(items: string[]) {
    this.#remove.push(...items);

    return this;
  }

  toString() {
    const statements = [
      `${this.#prefix} ${this.#patterns.join(", ")}`,
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
