type WhereOperator =
  | "="
  | "<"
  | ">"
  | "<="
  | ">="
  | "<>"
  | "!="
  | "LIKE"
  | "NOT LIKE"
  | "ILIKE"
  | "NOT ILIKE"
  | "IN"
  | "NOT IN"
  | "BETWEEN"
  | "NOT BETWEEN"
  | "IS NULL"
  | "IS NOT NULL";

class Where {
  #left: string;
  #operator: WhereOperator;
  #right: string;
  #negative: boolean;
  static supportedOperators: WhereOperator[] = [
    "=",
    "<",
    ">",
    "<=",
    ">=",
    "<>",
    "!=",
    "LIKE",
    "NOT LIKE",
    "ILIKE",
    "NOT ILIKE",
    "IN",
    "NOT IN",
    "BETWEEN",
    "NOT BETWEEN",
    "IS NULL",
    "IS NOT NULL",
  ];

  constructor(
    left: string,
    operator: WhereOperator,
    right: string,
    negative = false
  ) {
    this.#left = left;
    this.#operator = operator;
    this.#right = right;
    this.#negative = negative;
  }

  setNegative(isNegative: boolean) {
    this.#negative = isNegative;
  }

  static isWhereOperator(operator: string): operator is WhereOperator {
    return this.supportedOperators.includes(operator as WhereOperator);
  }

  toString() {
    return `${this.#negative ? "NOT " : ""}${this.#left} ${this.#operator} ${
      this.#right
    }`;
  }
}

export default Where;
