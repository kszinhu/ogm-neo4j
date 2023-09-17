import { OGM } from "@app/index";
import { Model } from "@models/index";
import { ProvidedPropertiesFactory } from "../../types/models";

export interface SearchOptions<Schema extends Record<string, any>> {
  limit?: number;
  skip?: number;
  orderBy?: keyof Schema & string;
  order?: "ASC" | "DESC";
}

export default function FindAll<
  Schema extends Record<string, any>,
  P extends ProvidedPropertiesFactory<
    keyof Schema & string,
    keyof Schema & string
  >
>(
  app: OGM,
  model: Model<Schema, P>,
  properties?: (keyof Schema & string)[],
  options?: SearchOptions<Schema>
) {
  const alias = "this";

  const builder = app.query();

  builder.match(alias, model);

  if (properties) {
    Object.entries(properties).forEach(([key, value]) => {
      builder.where(`${alias}.${key}`, value);
    });
  }

  if (options?.orderBy) {
    builder.orderBy(`${alias}.${options.orderBy}`, options.order);
  }

  return builder
    .return(alias)
    .limit(options?.limit ?? 25)
    .skip(options?.skip ?? 0)
    .execute();
}
