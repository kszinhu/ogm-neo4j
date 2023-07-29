import Queryable from "./queryable";
import Property from "./property";
import OGM from "../app/index";

import type {
  ModelSchema,
  PropertySchema,
  PropertyRelationSchema,
} from "../types/models";
import { PropertyType, type PropertyTypes } from "../types/lexer";

class Model<P extends Record<string, PropertySchema>> extends Queryable<P> {
  #name: string;
  #schema: ModelSchema<P>;
  #properties: Map<keyof P, Property<Exclude<PropertyTypes, "relation">>>;
  #relationships: Map<keyof P, Property<PropertyType.relation>>;
  #labels: string[];

  constructor(app: OGM, name: string, schema: ModelSchema<P>) {
    super(app);
    this.#name = name;
    this.#schema = schema;
    this.#properties = new Map();
    this.#relationships = new Map();
    this.#labels = schema.labels.sort();

    this.#transformSchemaToModel(schema);
  }

  /* @internal */
  #transformSchemaToModel(schema: ModelSchema<P>) {
    for (const [name, property] of Object.entries(schema.properties)) {
      switch (property.type) {
        case PropertyType.relation:
          this.addRelation(name, property as PropertyRelationSchema);
          break;
        default:
          this.addProperty(name, property);
      }
    }
  }

  /**
   * Get the name of this model.
   */
  name() {
    return this.#name;
  }

  /**
   * Get the schema of this model.
   */
  schema() {
    return this.#schema;
  }

  /**
   * Get the labels of this model.
   */
  labels() {
    return this.#labels;
  }

  /**
   * Get the properties of this model.
   */
  properties() {
    return this.#properties;
  }

  /**
   * Add a property to this model.
   */
  addProperty(
    name: string,
    schema: Exclude<PropertySchema, PropertyRelationSchema>
  ) {
    const property = new Property<Exclude<PropertyTypes, "relation">>(
      name,
      schema
    );

    this.#properties.set(name, property);

    return this;
  }

  /**
   * Add a relationship to this model.
   */
  addRelation(name: string, schema: PropertyRelationSchema) {
    const property = new Property<PropertyType.relation>(name, schema);

    this.#relationships.set(name, property);

    return this;
  }

  /**
   * Set the labels of this model.
   */
  setLabel(...labels: string[]) {
    this.#labels = labels.sort();
    this.#schema.labels = labels.sort();

    return this;
  }
}

export default Model;
