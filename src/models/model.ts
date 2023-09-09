import Queryable from "./queryable";
import Property from "./property";
import { OGM } from "@app/index";

import type {
  ModelSchema,
  PropertySchema,
  PropertyRelationSchema,
  ProvidedModelSchema,
  ProvidedPropertiesFactory as ProvidedModelProperties,
  ProvidedPropertySchema,
} from "../types/models";
import { PropertyType, type PropertyTypes } from "../types/lexer";

class Model<
  K extends string,
  P extends ProvidedModelProperties<K & string, K>
> extends Queryable<K & string, P> {
  #name: string;
  #schema: ModelSchema<any>;
  #properties: Map<
    keyof P & string,
    Property<Exclude<PropertyTypes, "relation">> // TODO: apply the correct type iterating over the P type
  >;
  #relationships: Map<keyof P & string, Property<PropertyType.relation>>;
  #labels: string[];

  constructor(app: OGM, name: string, schema: ProvidedModelSchema<K, K>) {
    super(app);
    this.#name = name;
    this.#schema = this.#transformProvidedSchemaToSchema(schema);
    this.#properties = new Map();
    this.#relationships = new Map();
    this.#labels = schema.labels.sort();

    this.#transformSchemaToModel(this.#schema);
  }

  /* @internal */
  #isPropertySchema(property: any): property is PropertySchema {
    return (
      Object.hasOwnProperty.call(property, "type") &&
      Object.hasOwnProperty.call(property, "readonly") &&
      Object.hasOwnProperty.call(property, "unique") &&
      Object.hasOwnProperty.call(property, "required") &&
      Object.hasOwnProperty.call(property, "defaultValue")
    );
  }

  /* @internal */
  #isProvidedSchema(property: any): property is ProvidedPropertySchema {
    return (
      property &&
      typeof property === "object" &&
      property.hasOwnProperty("type")
    );
  }

  /* @internal */
  #transformSchemaToModel(schema: ModelSchema<K & string>) {
    for (const [name, property] of Object.entries(schema.properties)) {
      if (!this.#isPropertySchema(property)) {
        throw new Error("Invalid property schema");
      }

      switch (property.type) {
        case PropertyType.relation:
          this.addRelation(name, property as PropertyRelationSchema);
          break;
        default:
          this.addProperty(name, property);
      }
    }
  }

  /* @internal */
  #transformProvidedSchemaToSchema(
    schema: ProvidedModelSchema<K & string, K>
  ): ModelSchema<K> {
    const properties: ModelSchema<K & string>["properties"] = {} as Record<
      K,
      PropertySchema
    >;

    for (let [name, property] of Object.entries(schema.properties)) {
      if (!this.#isProvidedSchema(property)) {
        throw new Error("Invalid provided schema");
      }

      property = {
        ...property,
        readonly: property.readonly ?? false,
        unique: property.unique ?? false,
        required: property.required ?? false,
        defaultValue: property.defaultValue ?? undefined,
      } as PropertySchema;

      if (!this.#isPropertySchema(property)) {
        throw new Error("Invalid property schema");
      }

      switch (property.type) {
        case PropertyType.relation:
          properties[name] = property as PropertyRelationSchema;
          break;
        default:
          properties[name] = property;
      }
    }

    return {
      labels: schema.labels,
      properties,
    };
  }

  /**
   * Get the name of this model.
   */
  get name() {
    return this.#name;
  }

  /**
   * Get the schema of this model.
   */
  get schema() {
    return this.#schema;
  }

  /**
   * Get the labels of this model.
   */
  get labels() {
    return this.#labels;
  }

  /**
   * Get the properties of this model.
   */
  get properties() {
    return this.#properties;
  }

  /**
   * Get all defined relationships of this model.
   */
  get relationships() {
    return this.#relationships;
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

    this.#properties.set(name as keyof P & string, property);

    return this;
  }

  /**
   * Add a relationship to this model.
   */
  addRelation(name: string, schema: PropertyRelationSchema) {
    const property = new Property<PropertyType.relation>(name, schema);

    this.#relationships.set(name as keyof P & string, property);

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
