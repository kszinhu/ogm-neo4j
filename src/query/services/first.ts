import { OGM } from "@app/index";
import { Model } from "@models/index";
import { ProvidedPropertiesFactory } from "../../types/models";

export default function First<
  Schema extends Record<string, any>,
  P extends ProvidedPropertiesFactory<
    keyof Schema & string,
    keyof Schema & string
  >
>(
  app: OGM,
  model: Model<Schema, P>,
  key: keyof Schema & string,
  value: Schema[keyof Schema]
) {
  const alias = "this",
    builder = app.query();

  builder.match(alias, model).where(`${alias}.${key}`, value);

  return builder.return(alias).limit(1).execute("READ");
}
