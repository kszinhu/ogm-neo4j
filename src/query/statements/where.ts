class WhereStatement {
  #prefix: string;
  #conditions: WhereStatement[];
  #connector: "AND" | "OR";

  constructor(prefix = "") {
    this.#prefix = prefix;
    this.#conditions = [];
    this.#connector = "AND";
  }

  setConector(connector: "AND" | "OR") {
    this.#connector = connector;
  }

  append(condition: WhereStatement) {
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
