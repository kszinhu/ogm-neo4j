class WhereBetween {
  #alias: string;
  #floor: string;
  #ceiling: string;
  #negative: boolean;

  constructor(alias: string, floor: string, ceiling: string, negative = false) {
    this.#alias = alias;
    this.#floor = floor;
    this.#ceiling = ceiling;
    this.#negative = negative;
  }

  setNegative(isNegative: boolean) {
    this.#negative = isNegative;
  }

  toString() {
    return `${this.#negative ? "NOT " : ""}$${this.#floor} <= ${
      this.#alias
    } <= $${this.#ceiling}`;
  }
}

export default WhereBetween;
