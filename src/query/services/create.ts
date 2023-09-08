import OGM from "@app/app.js";
import { Model } from "@models/index.js";

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

export default async function Create<M extends Model<any, any>>(
  app: OGM,
  model: M
) {
  return await GenerateDefaultValuesAsync(model).then((values) => {
    const builder = app.query();

    // add
  });
}
