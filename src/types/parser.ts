import {
  type ParserMethod,
  IParserConfig as ChevrotainParserConfig,
} from "chevrotain";
import { DirectionTypes, PropertyTypes } from "./lexer";

type AttributeKeys = `${PropertyTypes}Attribute`;

type AttributesRules = {
  [key in AttributeKeys]: ParserMethod<
    [],
    { type: PropertyTypes; values?: string[]; node?: string }
  >;
};

export enum RelationArgs {
  name = "name",
  direction = "direction",
}

export enum IdentifierArgs {
  auto = "auto",
}

interface IdentifierArgsList {
  auto?: boolean;
}

interface RelationArgsList {
  name?: string;
  direction?: DirectionTypes;
}

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
  // @hidden
  hiddenProperty: ParserMethod<[], boolean>;
  // @identifier | @identifier(auto: true)
  identifierArgsList: ParserMethod<[], { [key: string]: any }>;
  identifierArgs: ParserMethod<[], { [key: string]: any }>;
  identifierArg: ParserMethod<[], { name: string; value: string}>;
  // @relation(name: "name", direction: "OUT")
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
  primaryKey?: boolean;
  required?: boolean;
  unique?: boolean;
  multiple?: boolean;
  values?: string[]; // for enum
  default?: any;
  relation?: { name?: string; direction?: DirectionTypes }; // TODO: format property
  options: {
    hidden: boolean;
    identifier?: IdentifierArgsList;
  };
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
