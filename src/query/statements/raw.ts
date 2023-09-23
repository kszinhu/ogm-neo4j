export default class RawStatement {
  #statement: string;

  constructor(statement: string) {
    this.#statement = statement;
  }

  toString() {
    return this.#statement;
  }
}
