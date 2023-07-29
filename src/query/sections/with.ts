class With {
  #with: string[];
  #isDistinct: boolean;

  constructor({ withs = [], isDistinct = false }) {
    this.#with = withs;
    this.#isDistinct = isDistinct;
  }

  toString() {
    return `WITH ${this.#isDistinct ? "DISTINCT " : ""}${this.#with.join(",")}`;
  }
}

export default With;
