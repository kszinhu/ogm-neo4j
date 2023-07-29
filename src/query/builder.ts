import OGM from "../app/index";
import Statement from "./statement";
import Where from "./statements/where";

class Builder {
  #app: OGM;
  #params: { [key: string]: any };
  #statements: Statement[];
  #currentStatement?: Statement;
  #where: Where | null = null;

  constructor(app: OGM) {
    this.#app = app;

    this.#params = {};
    this.#statements = [];
  }

  statement(prefix: string): Builder {
    if (this.#currentStatement) this.#statements.push(this.#currentStatement);

    this.#currentStatement = new Statement(prefix);

    return this;
  }

  whereStatement(prefix: string): Builder {
    if (this.#where) this.#currentStatement?.where(this.#where);

    this.#where = new Where(prefix);

    return this;
  }
}

export default Builder;
