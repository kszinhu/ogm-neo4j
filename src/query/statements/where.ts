import Where from "@query/sections/where";
import RawStatement from "./raw";
import WhereId from "@query/sections/whereId";
import WhereBetween from "@query/sections/whereBetween";

class WhereStatement {
  #prefix: string;
  #conditions: (
    | WhereStatement
    | Where
    | WhereId
    | WhereBetween
    | RawStatement
  )[];
  #connector: "AND" | "OR";

  constructor(prefix = "") {
    this.#prefix = prefix;
    this.#conditions = [];
    this.#connector = "AND";
  }

  setConector(connector: "AND" | "OR") {
    this.#connector = connector;
  }

  append(
    condition: WhereStatement | Where | WhereId | WhereBetween | RawStatement
  ) {
    this.#conditions.push(condition);

    return this;
  }

  last() {
    return this.#conditions[this.#conditions.length - 1];
  }

  toString() {
    return `${this.#prefix} ${this.#conditions
      .map((c) => c.toString())
      .join(` ${this.#connector} `)}`;
  }
}

export default WhereStatement;
