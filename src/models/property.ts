import { DirectionTypes, PropertyType } from "../types/lexer";
import type { PropertySchema } from "../types/models";

class Property<T extends PropertySchema["type"]> {
  #name: string;
  #defaultValue: any;
  // @ts-expect-error
  #primaryKey: boolean;
  // @ts-expect-error
  #indexed: boolean;
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
  // @ts-expect-error
  #multiple: boolean;
  // @ts-expect-error
  #direction: T extends PropertyType.relation ? DirectionTypes : undefined;
  // @ts-expect-error
  #properties: T extends PropertyType.relation ? PropertySchema[] : undefined;
  // @ts-expect-error
  #target: T extends PropertyType.relation ? string : undefined;

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

  get indexed(): boolean {
    return !!(this.#primaryKey || this.#indexed);
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

  get multiple(): boolean {
    return !!this.#multiple;
  }

  get properties(): undefined | PropertySchema[] {
    return this.#properties;
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
