import { DirectionTypes } from "src/types/lexer";

type RelationshipDirection = Uppercase<DirectionTypes>;

class Relationship {
  #relationship: string | string[];
  #alias: string;
  #direction: RelationshipDirection;

  constructor(
    relationship: string | string[],
    alias: string,
    direction: RelationshipDirection
  ) {
    this.#relationship = relationship;
    this.#alias = alias;
    this.#direction = direction;
  }

  toString() {
    const direction = {
        in: this.#direction === "IN" ? "<" : "",
        out: this.#direction === "OUT" ? ">" : "",
      },
      alias = this.#alias ? this.#alias : "";
    let relationship = this.#relationship ?? "";

    if (Array.isArray(this.#relationship)) {
      relationship = this.#relationship.join("|");
    } else if (relationship) {
      relationship = `:${relationship}`;
    }

    const relationString =
      this.#relationship || this.#alias ? `[${alias}${relationship}]` : "";

    return `${direction.in}-${relationString}-${direction.out}`;
  }
}

export default Relationship;
