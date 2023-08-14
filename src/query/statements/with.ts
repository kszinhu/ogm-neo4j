export interface WithParams {
  withs: string[];
  isDistinct?: boolean;
}

class WithStatement {
  #with: string[];
  #isDistinct: boolean;

  constructor({ withs = [], isDistinct = false }: WithParams) {
    this.#with = withs;
    this.#isDistinct = isDistinct;
  }

  toString() {
    return `WITH ${this.#isDistinct ? "DISTINCT " : ""}${this.#with.join(",")}`;
  }
}

export default WithStatement;
