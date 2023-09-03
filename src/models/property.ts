import { DirectionTypes } from "../types/lexer";
import type { PropertySchema } from "../types/models";

class Property<T extends PropertySchema["type"]> {
  #name: string;
  #defaultValue: any;
  // @ts-expect-error
  #type: T;
  // @ts-expect-error
  #readonly: boolean;
  // @ts-expect-error
  #unique: boolean;
  // @ts-expect-error
  #required: boolean;
  // @ts-expect-error
  #hidden: boolean;
  #direction: undefined | DirectionTypes;
  #target: undefined | string;

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

  get direction(): undefined | DirectionTypes {
    return this.#direction;
  }

  get target(): undefined | string {
    return this.#target;
  }

  get from(): undefined | string {
    return this.#direction === "out" ? this.#target : undefined;
  }

  // TODO: implement this feature
  get hidden() {
    return this.#hidden;
  }

  isInteger(): this is Property<"integer"> {
    return this.#type === "integer";
  }
}

export default Property;
