class WhereId {
  #alias: string;
  #value: string;
  #negative: boolean;

  constructor(alias: string, value: string, negative = false) {
    this.#alias = alias;
    this.#value = value;
    this.#negative = negative;
  }

  setNegative(isNegative: boolean) {
    this.#negative = isNegative;
  }

  toString() {
    return `${this.#negative ? "NOT " : ""}ID(${this.#alias}) = $${
      this.#value
    }`;
  }
}

export default WhereId;
