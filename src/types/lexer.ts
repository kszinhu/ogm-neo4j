export type DirectionTypes = "in" | "out" | "both";

export enum PropertyType {
  integer = "integer",
  decimal = "decimal",
  string = "string",
  boolean = "boolean",
  date = "date",
  datetime = "datetime",
  time = "time",
  timestamp = "timestamp",
  relation = "relation",
  enum = "enum",
  localdatetime = "localdatetime",
  localtime = "localtime",
  point = "point",
}

export type PropertyTypes =
  | "integer"
  | "decimal"
  | "string"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "timestamp"
  | "relation"
  | "enum"
  | "localdatetime"
  | "localtime"
  | "point";

export type TokensName =
  | "NodeReserved"
  | "RelationshipReserved"
  | "EnumReserved"
  | "StringReserved"
  | "IntegerReserved"
  | "DecimalReserved"
  | "DateTimeReserved"
  | "DateReserved"
  | "TimeReserved"
  | "LocaledatetimeReserved"
  | "LocaltimeReserved"
  | "PointReserved"
  | "RelationReserved"
  | "RelationArgNameReserved"
  | "RelationArgDirectionReserved"
  | "DirectionINReserved"
  | "DirectionOUTReserved"
  | "DirectionBOTHReserved"
  | "Identifier"
  | "Colon"
  | "Comma"
  | "OpeningBrace"
  | "ClosingBrace"
  | "OpeningBracket"
  | "ClosingBracket"
  | "OpeningParenthesis"
  | "ClosingParenthesis"
  | "FunctionOperator"
  | "OptionalOperator"
  | "whitespace"
  | "StringLiteral"
  | "StringLiteral"
  | "IntegerLiteral"
  | "DecimalLiteral"
  | "DateLiteral"
  | "DateTimeLiteral"
  | "TimeLiteral"
  | "LocationLiteral"
  | "Comment";

export interface IEnumType {
  name: string;
  permittedValues: string[];
}

export interface IRelationType {
  name: string;
  direction: DirectionTypes;
}
