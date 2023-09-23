import { Dict } from "neo4j-driver-core/types/record";
import { QueryResult } from "neo4j-driver";

import {
  ProvidedModelSchema,
  ProvidedPropertiesFactory,
} from "../types/models";
import SchemaError from "@errors/schema";
import EntityError from "@errors/entity";
import { Model } from "@models/index";

type PropertiesSchema<S extends Record<string, any>> = ProvidedModelSchema<
  keyof S & string,
  keyof S & string
>["properties"];

/**
 * Class responsible for formatting the query results.
 */
class Formatter<Schema extends Record<string, any>> {
  #supportedLabels: string[] = [];
  #schema: PropertiesSchema<Schema>;
  #model: Model<
    Schema,
    ProvidedPropertiesFactory<keyof Schema & string, keyof Schema & string>
  >;

  constructor(
    model: Model<
      Schema,
      ProvidedPropertiesFactory<keyof Schema & string, keyof Schema & string>
    >,
    schema: ProvidedModelSchema<keyof Schema & string, keyof Schema & string>
  ) {
    this.#model = model;
    this.#schema = schema.properties;
    this.#supportedLabels = schema.labels;
  }

  #entityContainsAlias(entity: Dict, alias: string) {
    return Object.keys(entity).includes(alias);
  }

  #labelIsSupported(label: string) {
    return this.#supportedLabels.includes(label);
  }

  /**
   * Format the query results.
   */
  format(result: QueryResult): Map<string, Dict> {
    const formattedResult: Map<string, Dict> = new Map();

    result.records.reduce((acc, record) => {
      const alias = record.keys[0] as string,
        entity = record.toObject();

      if (this.#model.entity === "node" && !this.#model.primaryKey)
        throw new SchemaError({
          cause: "Missing primary key",
          message: "Missing primary key",
        });

      if (!this.#entityContainsAlias(entity, alias))
        throw new EntityError({
          cause: "Entity does not contain alias",
          message: `Entity does not contain alias ${alias}`,
        });

      const { identity, labels, properties } = entity[alias] as {
        identity: number;
        labels: string[];
        properties: Record<string, any>;
      };

      if (!labels || !properties)
        throw new EntityError({
          cause: "Missing labels or properties",
          message: "Invalid Entity",
        });

      if (labels.some((label) => !this.#labelIsSupported(label))) {
        // TODO: implement import formatters between models (using model-map)
        throw new EntityError({ cause: "Unsupported label", message: "" });
      }

      const publicProperties: Record<string, any> = Object.keys(
        properties
      ).reduce(
        (acc, curr) =>
          this.#schema[curr].hidden
            ? acc
            : { ...acc, [curr]: properties[curr] },
        {}
      );

      return acc.set(
        this.#model.primaryKey
          ? properties[this.#model.primaryKey]
          : identity.toString(),
        publicProperties
      );
    }, formattedResult);

    return formattedResult;
  }
}

export default Formatter;
