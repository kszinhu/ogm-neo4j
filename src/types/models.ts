import { Model } from "@models/index";
import type { PropertyType, PropertyTypes } from "./lexer";

/**
 * Change the type of Keys of T from NewType
 */
export type ChangeTypeOfKeys<
  T extends object,
  Keys extends keyof T,
  NewType
> = {
  // Loop to every key. We gonna check if the key
  // is assignable to Keys. If yes, change the type.
  // Else, retain the type.
  [key in keyof T]: key extends Keys ? NewType : T[key];
};

type BasePropertySchema = {
  readonly: boolean;
  unique: boolean;
  required: boolean;
  defaultValue: any;
  multiple: boolean;
  value: any;
};

export type PropertySchema = {
  readonly: boolean;
  unique: boolean;
  required: boolean;
  defaultValue: any;
  multiple: boolean;
  value: any;
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
  multiple?: boolean;
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
      multiple: boolean;
      supportedValues: string[];
    }
);

export type IdentifierPropertySchema = {
  readonly: true;
  unique: true;
  required: true;
  defaultValue?: never;
  multiple?: never;
  type: Exclude<
    PropertyTypes,
    | PropertyType.relation
    | PropertyType.enum
    | PropertyType.boolean
    | PropertyType.timestamp
    | PropertyType.point
    | PropertyType.date
    | PropertyType.datetime
    | PropertyType.time
    | PropertyType.localdatetime
    | PropertyType.localtime
  >;
};

export type ProvidedPropertiesFactory<
  K extends string,
  Identifier extends K
> = Record<
  K & string,
  K & string extends Identifier
    ? IdentifierPropertySchema | ProvidedPropertySchema
    : ProvidedPropertySchema
>;

export interface ProvidedModelSchema<K extends string, Identifier extends K> {
  labels: string[];
  properties: ProvidedPropertiesFactory<K & string, Identifier>;
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
  M["properties"] extends Map<infer K, infer V>
    ? V extends IdentifierPropertySchema | ProvidedPropertySchema
      ? V
      : never
    : never;
