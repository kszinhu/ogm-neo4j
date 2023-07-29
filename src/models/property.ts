import type { PropertyTypes } from "../types/lexer";
import type { PropertySchema } from "../types/models";

class Property<T extends PropertySchema["type"]> {
  #name: string;
  // @ts-expect-error
  #type: T;
  // @ts-expect-error
  #readonly: boolean;
  // @ts-expect-error
  #unique: boolean;
  // @ts-expect-error
  #required: boolean;
  #defaultValue: any;

  constructor(name: string, schema: PropertySchema) {
    this.#name = name;

    Object.entries(schema).forEach(([key, value]) => {
      this[`#${key}`] = value;
    });
  }

  get name() {
    return this.#name;
  }

  get type() {
    return this.#type;
  }

  get defaultValue(): any {
    return this.#defaultValue;
  }

  get readonly(): boolean {
    return !!this.#readonly;
  }

  get unique(): boolean {
    return !!this.#unique;
  }

  get required(): boolean {
    return !!this.#required;
  }
}

export default Property;
