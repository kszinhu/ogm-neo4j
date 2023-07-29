import Model from "src/models/model";
import Property from "./property";

class Match {
  #alias: string;
  #model: Model<any> | string = "";
  #properties: Property[] = [];

  constructor(
    alias: string,
    model?: Model<any> | string,
    properties: Property[] = []
  ) {
    this.#alias = alias;
    this.#model = model ?? "";
    this.#properties = properties;
  }

  toString() {
    let model = "",
      properties = "";

    if (this.#model instanceof Model) {
      model = `:${this.#model.labels().join(":")}`;
    } else if (typeof this.#model === "string") {
      model = `:${this.#model}`;
    }

    if (this.#properties.length > 0) {
      properties = `{ ${this.#properties.map((p) => p.toString()).join(",")} }`;
    }

    return `(${this.#alias}${model}${properties})`;
  }
}

export default Match;
