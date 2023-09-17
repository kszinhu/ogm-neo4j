import { Dict } from "neo4j-driver-core/types/record";
import { ProvidedModelSchema } from "../types/models";
import { QueryResult } from "neo4j-driver";

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

  constructor(
    schema: ProvidedModelSchema<keyof Schema & string, keyof Schema & string>
  ) {
    this.#supportedLabels = schema.labels;
    this.#schema = schema.properties;
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
      const alias = record.keys[0] as string;
      const entity = record.toObject();

      if (!this.#entityContainsAlias(entity, alias))
        throw new Error("Invalid entity");

      const { identity, labels, properties } = entity[alias] as {
        identity: number;
        labels: string[];
        properties: any;
      };

      if (!labels || !properties) throw new Error("Invalid node");

      if (labels.some((label) => !this.#labelIsSupported(label))) {
        // TODO: implement import formatters between models (using model-map)
        throw new Error("Unsupported label");
      }

      return acc.set(identity.toString(), properties);
    }, formattedResult);

    return formattedResult;
  }
}

export default Formatter;
