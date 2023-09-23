import { Model } from "@models/index";
import { EnumMember } from "typescript";
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

/**
 * Get a property type and return Typescript type
 *
 * @deprecated
 */
export type PropertyTypeToType<T extends string> = T extends PropertyType.string
  ? string
  : T extends PropertyType.integer
  ? number
  : T extends PropertyType.decimal
  ? number
  : T extends PropertyType.boolean
  ? boolean
  : T extends PropertyType.timestamp
  ? Date
  : T extends PropertyType.point
  ? [number, number]
  : T extends PropertyType.date
  ? Date
  : T extends PropertyType.datetime
  ? Date
  : T extends PropertyType.time
  ? Date
  : T extends PropertyType.localdatetime
  ? Date
  : T extends PropertyType.localtime
  ? Date
  : T extends PropertyType.enum
  ? string
  : never;

type BasePropertySchema = {
  primaryKey: boolean;
  readonly: boolean;
  unique: boolean;
  required: boolean;
  defaultValue: any;
  multiple: boolean;
  value: any;
};

export type PropertySchema = {
  primaryKey: boolean;
  readonly: boolean;
  unique: boolean;
  required: boolean;
  defaultValue: any;
  multiple: boolean;
  value: any;
} & (
  | {
      type: Exclude<PropertyType[number], PropertyType.relation>;
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
  primaryKey?: boolean;
  readonly?: boolean;
  unique?: boolean;
  hidden?: boolean;
  required?: boolean;
  defaultValue?: any;
  multiple?: boolean;
} & (
  | {
      type: Exclude<PropertyType[number], PropertyType.relation>;
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
  primaryKey: true;
  required: true;
  hidden: boolean;
  defaultValue?: never;
  multiple?: never;
  type: Exclude<
    PropertyType,
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

// if the key is equal to the identifier, then property is IdentifierPropertySchema else ProvidedPropertySchema
export type ProvidedPropertiesFactory<
  Keys extends string,
  Identifier extends Keys
> = {
  [key in Keys]: Identifier extends key
    ? IdentifierPropertySchema
    : ProvidedPropertySchema;
};

// TODO: create a properties factory to get a simple interface and create provided properties

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

export type ModelIdentifier<
  P extends ProvidedPropertiesFactory<any, any>,
  S extends Record<string, any>
> = P extends ProvidedPropertiesFactory<infer K, infer Identifier>
  ? Identifier extends K
    ? S[Identifier]
    : never
  : never;

export interface EntityResult<M extends Model<any, any>> {
  identity: number;
  elementId: `${number}:${string}:${number}`;
  labels: M["labels"];
  properties: Record<keyof M["properties"], any>;
}
