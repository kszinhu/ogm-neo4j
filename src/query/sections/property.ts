class Property {
  #property: string;
  #param: string;
  #operator: string;

  constructor(property: string, param?: string, operator: string = "=") {
    this.#property = property;
    this.#param = param ?? "null";
    this.#operator = operator;
  }

  toString() {
    return `${this.#property} ${this.#operator} $${this.#param}`.trim();
  }
}

export default Property;
