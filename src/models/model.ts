import { ZodSchema, z } from "zod";

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
  Schema extends Record<string, any>,
  P extends ProvidedModelProperties<
    keyof Schema & string,
    keyof Schema & string
  >
> extends Queryable<Schema, P> {
  #name: string;
  #schema: ModelSchema<any>;
  #properties: Map<
    keyof P & string,
    Property<Exclude<PropertyTypes, "relation">> // TODO: apply the correct type iterating over the P type
  >;
  #relationships: Map<keyof P & string, Property<PropertyType.relation>>;
  #labels: string[];

  constructor(
    app: OGM,
    name: string,
    schema: ProvidedModelSchema<keyof Schema & string, keyof Schema & string>
  ) {
    super(app, schema);
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
  #transformSchemaToModel(schema: ModelSchema<keyof Schema & string>) {
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
    schema: ProvidedModelSchema<keyof Schema & string, keyof Schema & string>
  ): ModelSchema<keyof Schema & string> {
    const properties: ModelSchema<keyof Schema & string>["properties"] =
      {} as Record<keyof Schema, PropertySchema>;

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
          properties[name as keyof Schema & string] =
            property as PropertyRelationSchema;
          break;
        default:
          properties[name as keyof Schema & string] = property;
      }
    }

    return {
      labels: schema.labels,
      properties,
    };
  }

  /**
   * Client-side validation of the provided schema.
   */
  #validate(data: Record<string, any>) {
    const schemaValidation: Record<string, ZodSchema<any>> = Object.entries(
      this.#schema.properties
    ).reduce((acc, [name, property]) => {
      if (!this.#isProvidedSchema(property))
        throw new Error("Invalid provided schema");

      const normalizeKey = {
        string: "string",
        boolean: "boolean",
        float: "bigint",
        integer: "number",
        date: "date",
      };

      let propertyValidation: ZodSchema<any> = z[
        property.multiple ? "array" : normalizeKey[property.type]
      ](property.multiple ? z[property.type]() : undefined);

      if (!property.required)
        propertyValidation = propertyValidation.optional();

      return {
        ...acc,
        [name]: propertyValidation,
      };
    }, {});

    return z.object(schemaValidation).parse(data);
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

  create(data: Schema) {
    this.#validate(data);

    return super.create(data);
  }
}

export default Model;
