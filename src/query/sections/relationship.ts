type RelationshipDirection =
  | "DIRECTION_IN"
  | "DIRECTION_OUT"
  | "DIRECTION_BOTH";

class Relationship {
  #relationship: string | string[];
  #alias: string;
  #direction: RelationshipDirection;
  #traversals: string[];

  constructor(
    relationship: string | string[],
    alias: string,
    direction: RelationshipDirection,
    traversals: string[]
  ) {
    this.#relationship = relationship;
    this.#alias = alias;
    this.#direction = direction;
    this.#traversals = traversals;
  }

  toString() {
    const direction = {
        in: this.#direction === "DIRECTION_IN" ? "<" : "",
        out: this.#direction === "DIRECTION_OUT" ? ">" : "",
      },
      traversals = this.#traversals ? `*${this.#traversals.join("")}` : "",
      alias = this.#alias ? this.#alias : "";
    let relationship = this.#relationship ?? "";

    if (Array.isArray(this.#relationship)) {
      relationship = this.#relationship.join("|");
    } else if (relationship) {
      relationship = `:${relationship}`;
    }

    const relationString =
      this.#relationship || this.#alias || this.#traversals
        ? `[${alias}${relationship}${traversals}]`
        : "";

    return `${direction.in}-${relationString}-${direction.out}`;
  }
}

export default Relationship;
