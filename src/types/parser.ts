import {
  type ParserMethod,
  IParserConfig as ChevrotainParserConfig,
} from "chevrotain";
import { DirectionTypes, PropertyTypes } from "./lexer.js";

type AttributeKeys = `${PropertyTypes}Attribute`;

type AttributesRules = {
  [key in AttributeKeys]: ParserMethod<
    [],
    { type: PropertyTypes; values?: string[]; node?: string }
  >;
};

type EmbeddedActions = {
  [key in keyof ParserRules]: ParserRules[key];
};

export interface ParserRules extends AttributesRules {
  schemaParser: ParserMethod<[], SchemaOfApplication>;
  nodeDeclaration: ParserMethod<[], NodeApp>;
  relationDeclaration: ParserMethod<[], RelationApp>;
  nodeProperties: ParserMethod<[], NodeApp["properties"]>;
  nodeProperty: ParserMethod<[], Property>;
  relationProperties: ParserMethod<[], RelationApp["properties"]>;
  relationProperty: ParserMethod<[], Property>;
  attribute: ParserMethod<[], { type: PropertyTypes; values?: string[] }>;
  enumValues: ParserMethod<[], string[]>;
  relationArgsList: ParserMethod<[], { [key: string]: string }>;
  relationArgs: ParserMethod<[], { [key: string]: string }>;
  relationArg: ParserMethod<[], { name: string; value: string }>;
}

export type ParserConfig = ChevrotainParserConfig & {
  debug?: boolean;
  outputPath?: string;
};

export interface Property {
  type: PropertyTypes;
  values?: string[]; // for enum
  required?: boolean;
  default?: any;
  unique?: boolean;
  multiple?: boolean;
  relation?: { name?: string; direction?: DirectionTypes };
}

export interface RelationApp {
  identifier: string;
  properties: { [key: string]: Property };
}

export interface NodeApp {
  identifier: string;
  properties: { [key: string]: Property };
}

export interface SchemaOfApplication {
  nodes: Map<NodeApp["identifier"], NodeApp>;
  relations: Map<RelationApp["identifier"], RelationApp>;
}

declare abstract class SchemaAppParser {
  abstract rules: ParserRules;
  abstract parse: () => void;

  constructor(config?: ParserConfig);
}

export { SchemaAppParser };
