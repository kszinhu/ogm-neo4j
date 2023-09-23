import { OGM } from "@app/index";
import { Model } from "@models/index";
import Entity from "@models/entity";
import { addNodeToStatement } from "./utils/splitProperties";
import { int as convertToInteger } from "neo4j-driver";
import { EntityResult, ProvidedPropertiesFactory } from "../../types/models";

function GenerateDefaultValuesAsync<M extends Model<any, any>>(
  model: M
): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    const schema = model.schema;

    const defaultValues: Record<string, any> = {};

    for (const [key, field] of Object.entries(schema.properties)) {
      // TODO: add support for UUID values

      if (field.defaultValue) {
        defaultValues[key] = field.defaultValue;
      }
    }

    resolve(defaultValues);
  });
}

export default async function Create<
  Schema extends Record<string, any>,
  P extends ProvidedPropertiesFactory<
    keyof Schema & string,
    keyof Schema & string
  >
>(
  app: OGM,
  model: Model<Schema, P>,
  properties: Schema
): Promise<Entity<Schema>> {
  return GenerateDefaultValuesAsync(model).then(() => {
    const builder = app.query(),
      alias = "this";

    addNodeToStatement(app, builder, model, properties, alias, [alias]);
    builder.return(alias);

    return builder.execute().then((result) => {
      const { identity, properties } = result.records[0].get(
        alias
      ) as EntityResult<Model<Schema, P>>;

      return new Entity<Schema>(
        convertToInteger(identity),
        properties as Schema
      );
    });
  });
}
