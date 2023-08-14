import { Model } from "@models/index";
import type { PropertyType, PropertyTypes } from "./lexer";

type BasePropertySchema = {
  readonly: boolean;
  unique: boolean;
  required: boolean;
  defaultValue: any;
};

export type PropertySchema = {
  readonly: boolean;
  unique: boolean;
  required: boolean;
  defaultValue: any;
} & (
  | {
      type: Exclude<PropertyTypes, "relation">;
    }
  | {
      type: PropertyType.relation;
      target: string;
      properties: PropertySchema[];
    }
  | {
      type: PropertyType.enum;
      supportedValues: string[];
    }
);

export type ProvidedPropertySchema = {
  readonly?: boolean;
  unique?: boolean;
  required?: boolean;
  defaultValue?: any;
} & (
  | {
      type: Exclude<PropertyTypes, "relation">;
    }
  | {
      type: PropertyType.relation;
      target: string;
      properties: PropertySchema[];
    }
  | {
      type: PropertyType.enum;
      supportedValues: string[];
    }
);

export type ProvidedPropertiesFactory<K extends string> = Record<
  K & string,
  ProvidedPropertySchema
>;

export interface ProvidedModelSchema<K extends string> {
  labels: string[];
  properties: ProvidedPropertiesFactory<K & string>;
}

export interface PropertyRelationSchema extends BasePropertySchema {
  type: PropertyType.relation;
  target: string;
  properties: PropertySchema[];
}

export interface ModelSchema<K extends string> {
  labels: string[];
  properties: Record<K, PropertySchema>;
}

export type ModelProperties<P extends Record<string, PropertySchema>> = P & {
  labels: string[];
};

export type ModelIdentifier<M extends Model<any, any>> =
  M["properties"] extends Map<string, infer V>
    ? V extends PropertySchema
      ? V["unique"] extends true
        ? V
        : never
      : never
    : never;
