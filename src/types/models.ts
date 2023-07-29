import type { PropertyType, PropertyTypes } from "./lexer";

type BasePropertySchema = {
  readonly: boolean;
  unique: boolean;
  required: boolean;
  defaultValue: any;
};

export type PropertySchema = BasePropertySchema &
  (
    | {
        type: Exclude<PropertyTypes, "relation">;
      }
    | {
        type: PropertyType.relation;
        target: string;
        properties: PropertySchema[];
      }
  );

export interface PropertyRelationSchema extends BasePropertySchema {
  type: PropertyType.relation;
  target: string;
  properties: PropertySchema[];
}

export interface ModelSchema<P extends Record<string, PropertySchema>> {
  labels: string[];
  properties: Record<keyof P, PropertySchema>;
}

export type ModelProperties<P extends Record<string, PropertySchema>> = P & {
  labels: string[];
};
