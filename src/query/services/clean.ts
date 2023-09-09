import { temporal, int, types } from "neo4j-driver";
import { PropertySchema } from "src/types/models";

const temporalTypes = [
  "date",
  "datetime",
  "time",
  "localdatetime",
  "localtime",
  "duration",
];

/**
 * Convert a value to the correct type for a property.
 */
export default function CleanValue(config: PropertySchema, value: any) {
  if (
    temporalTypes.includes(config.type.toLowerCase()) &&
    (typeof value == "number" || typeof value == "string")
  ) {
    value = new Date(value);
  }

  switch (config.type) {
    case "decimal":
      value = Number(value);
      break;

    case "integer":
      value = int(value);
      break;

    case "boolean":
      value = Boolean(value);
      break;

    case "timestamp":
      value = value instanceof Date ? value.getTime() : value;
      break;

    case "date":
      value =
        value instanceof Date ? types.Date.fromStandardDate(value) : value;
      break;

    case "datetime":
      value =
        value instanceof Date ? types.DateTime.fromStandardDate(value) : value;
      break;

    case "localtime":
      value =
        value instanceof Date ? types.LocalTime.fromStandardDate(value) : value;
      break;

    case "point":
      if ("x" in value && "y" in value) {
        if (isNaN(value.x)) {
          if (isNaN(value.height)) {
            if (!("latitude" in value && "longitude" in value)) {
              throw new Error(`Invalid point value: ${JSON.stringify(value)}`);
            }
            value = new types.Point(4326, value.longitude, value.latitude);
          } else {
            value = new types.Point(
              4979,
              value.longitude,
              value.latitude,
              value.height
            );
          }
        } else if ("z" in value) {
          if (isNaN(value.x)) {
            if (isNaN(value.height)) {
              value = new types.Point(4326, value.longitude, value.latitude);
            } else {
              value = new types.Point(
                4979,
                value.longitude,
                value.latitude,
                value.height
              );
            }
          } else {
            if (isNaN(value.z)) {
              value = new types.Point(7203, value.x, value.y);
            } else {
              value = new types.Point(9157, value.x, value.y, value.z);
            }
          }
        } else {
          throw new Error(`Invalid point value: ${JSON.stringify(value)}`);
        }
      }
    default:
      throw new Error(`Invalid type: ${config.type}`);
  }

  return value;
}
