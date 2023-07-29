class Return {
  #alias: string;
  #as: string;

  constructor(alias: string, as: string) {
    this.#alias = alias;
    this.#as = as;
  }

  toString() {
    return `${this.#alias}${this.#as ? ` AS ${this.#as}` : ""}`;
  }
}

export default Return;
