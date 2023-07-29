import Model from "src/models/model";

class Create {
  #alias: string;
  #model?: Model<any>;

  constructor(alias: string, model?: Model<any>) {
    this.#alias = alias;
    this.#model = model;
  }

  toString() {
    const alias = this.#alias ?? "";
    let model: string = "";

    if (this.#model instanceof Model) {
      model = `:${this.#model.labels().join(":")}`;
    } else if (typeof this.#model === "string") {
      model = `:${this.#model}`;
    }

    return `(${alias}${model})`;
  }
}

export default Create;