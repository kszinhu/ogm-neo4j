import { IEnumType as Enum, IRelationType as Relation } from "src/types/lexer";

const isEnum = (value: any): value is Enum => {
  return value.name && value.permittedValues;
};

const isRelation = (value: any): value is Relation => {
  return value.name && value.direction;
};

export default { isEnum, isRelation };
