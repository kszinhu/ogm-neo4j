import { readFileSync } from "fs";
import { createToken, Lexer, ILexingResult, ILexerConfig } from "chevrotain";
import { IdentifierArgs, RelationArgs } from "../types/parser";
import { PropertyTypes } from "../types/lexer";

/**
 * Responsible for tokenizing the schema file.
 *
 * Using the Chevrotain lexer generator to tokenize the schema file.
 */
class SchemaTokenizer {
  #schemaFile: string;
  #tokenizedSchema: ILexingResult["tokens"];

  /**
   * Tokens for Schema language.
   */
  static tokens = {
    reserved: [
      createToken({ name: "NodeReserved", pattern: /Node/ }),
      createToken({
        name: "RelationshipReserved",
        pattern: /Relationship/,
      }),
      createToken({ name: "BooleanReserved", pattern: /Boolean/ }),
      createToken({ name: "UUIDReserved", pattern: /UUID/ }),
      createToken({ name: "EnumReserved", pattern: /Enum/ }),
      createToken({ name: "StringReserved", pattern: /String/ }),
      createToken({ name: "IntegerReserved", pattern: /Int/ }),
      createToken({ name: "DecimalReserved", pattern: /Decimal/ }),
      createToken({ name: "DateTimeReserved", pattern: /DateTime/ }),
      createToken({ name: "DateReserved", pattern: /Date/ }),
      createToken({ name: "TimestampReserved", pattern: /Timestamp/ }),
      createToken({ name: "LocalDatetimeReserved", pattern: /LocalDateTime/ }),
      createToken({ name: "LocalTimeReserved", pattern: /LocalTime/ }),
      createToken({ name: "PointReserved", pattern: /Point/ }),
      createToken({ name: "TimeReserved", pattern: /Time/ }),
      createToken({ name: "RelationReserved", pattern: /relation/ }),
      createToken({ name: "IdentifierReserved", pattern: /identifier/ }),
      createToken({ name: "DirectionINReserved", pattern: /in/ }),
      createToken({ name: "DirectionOUTReserved", pattern: /out/ }),
      createToken({ name: "DirectionBOTHReserved", pattern: /both/ }),
      createToken({ name: "HiddenReserved", pattern: /hidden/ }),
    ],
    constants: [
      // UUIDv4
      createToken({
        name: "UUIDLiteral",
        pattern: /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/,
      }),
      createToken({ name: "BooleanLiteral", pattern: /true|false/i }),
      createToken({ name: "StringLiteral", pattern: /'(.+?)?(?=')'/ }),
      createToken({ name: "StringLiteral", pattern: /"(.+?)?(?=")"/ }),
      createToken({ name: "IntegerLiteral", pattern: /\d+/ }),
      createToken({ name: "DecimalLiteral", pattern: /\d+\.\d+/ }),
      createToken({ name: "DateLiteral", pattern: /\d{4}-\d{2}-\d{2}/ }),
      createToken({
        name: "DateTimeLiteral",
        pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      }),
      createToken({ name: "TimeLiteral", pattern: /\d{2}:\d{2}:\d{2}/ }),
      createToken({
        name: "LocationLiteral",
        pattern: /\d{1,3}°\d{1,2}'\d{1,2}"[NS],\s\d{1,3}°\d{1,2}'\d{1,2}"[EW]/,
      }),
    ],
    identifiers: [createToken({ name: "Identifier", pattern: /[a-zA-Z_]\w*/ })],
    separators: [
      createToken({ name: "Colon", pattern: /:/ }),
      createToken({ name: "Comma", pattern: /,/ }),
      createToken({ name: "OpeningBrace", pattern: /{/ }),
      createToken({ name: "ClosingBrace", pattern: /}/ }),
      createToken({ name: "OpeningBracket", pattern: /\[/ }),
      createToken({ name: "ClosingBracket", pattern: /\]/ }),
      createToken({ name: "OpeningParenthesis", pattern: /\(/ }),
      createToken({ name: "ClosingParenthesis", pattern: /\)/ }),
    ],
    operators: [
      // is FunctionOperator if "@relation"
      createToken({ name: "FunctionOperator", pattern: /@/ }),
      createToken({ name: "OptionalOperator", pattern: /\?/ }),
    ],
    whitespace: [
      createToken({ name: "whitespace", pattern: / /, group: Lexer.SKIPPED }),
      createToken({ name: "whitespace", pattern: /\t/, group: Lexer.SKIPPED }),
      createToken({ name: "whitespace", pattern: /\n/, group: Lexer.SKIPPED }),
      createToken({ name: "whitespace", pattern: /\r/, group: Lexer.SKIPPED }),
    ],
    comments: [
      createToken({
        name: "Comment",
        pattern: /\/\/.*/,
        group: Lexer.SKIPPED,
      }),
    ],
  } as const;

  /**
   * Named tokens for Schema language.
   */
  static namedTokens: {
    [key: string]: ReturnType<typeof createToken>;
  } = {
    ...this.tokens.reserved.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: curr }),
      {}
    ),
    ...this.tokens.identifiers.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: curr }),
      {}
    ),
    ...this.tokens.separators.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: curr }),
      {}
    ),
    ...this.tokens.operators.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: curr }),
      {}
    ),
    ...this.tokens.whitespace.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: curr }),
      {}
    ),
    ...this.tokens.constants.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: curr }),
      {}
    ),
    ...this.tokens.comments.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: curr }),
      {}
    ),
  } as const;

  static allTokens = Object.values(this.tokens).reduce(
    (acc, curr: any) => acc.concat(curr),
    []
  );

  static relationParams: RelationArgs[keyof RelationArgs][] = [
    RelationArgs.name,
    RelationArgs.direction,
  ];

  static identifierParams: IdentifierArgs[keyof IdentifierArgs][] = [
    IdentifierArgs.auto,
  ];

  static supportedIdentifierTypes: PropertyTypes[] = [
    "UUID",
    "integer",
    "string",
  ];

  /**
   * @param schemaPath The path to the schema file.
   */
  constructor(schemaPath: string, options?: ILexerConfig) {
    const lexerInstance = new Lexer(SchemaTokenizer.allTokens, options);

    // Read the schema file.
    this.#schemaFile = readFileSync(schemaPath, "utf-8");

    // Tokenize the schema file.
    this.#tokenizedSchema = lexerInstance.tokenize(this.#schemaFile).tokens;
  }

  /**
   * Get the tokenized schema file.
   */
  get tokenizedSchema(): ILexingResult["tokens"] {
    return this.#tokenizedSchema;
  }
}

export default SchemaTokenizer;
