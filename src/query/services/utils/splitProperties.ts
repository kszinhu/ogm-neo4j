import { Model } from "@models/index";
import { castValues } from "./toCypher";

interface splitPropertiesReturn {
  inlineProperties: Record<string, any>;
  setProperties: Record<string, any>;
  onCreateProperties: Record<string, any>;
  onMatchProperties: Record<string, any>;
}

function splitProperties<M extends Model<any, any>>(
  model: M
): splitPropertiesReturn {
  model.properties().forEach((property, _key, properties) => {
    const { name } = property;

    // HOW TO CATCH VALUE
    const value = castValues(property, value);
  });

  return {};
}
