class Order {
  #property: string;
  #how: string;

  constructor(property: string, how?: string) {
    this.#property = property;
    this.#how = how ?? "ASC";
  }

  toString() {
    return `${this.#property} ${this.#how}`.trim();
  }
}

export default Order;
