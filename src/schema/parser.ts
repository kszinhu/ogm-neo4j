import { EmbeddedActionsParser } from "chevrotain";

import type { PropertyTypes } from "../types/lexer";
import type {
  NodeApp,
  Property,
  RelationApp,
  SchemaOfApplication as Schema,
  ParserConfig,
  ParserRules,
  SchemaAppParser,
} from "../types/parser";

import SchemaTokenizer from "./lexer";
import { createIfNotExists as createDebugFile } from "@utils/debugFiles";

/**
 * Responsible for parsing the schema file and generate the schema of the database.
 *
 * Using the Chevrotain parser generator to co29/07/2023nsume the tokens from the tokenizer.
 */
class SchemaParser extends EmbeddedActionsParser implements SchemaAppParser {
  /**
   * Rules for Schema Language.
   */
  rules: ParserRules = {
    schemaParser: this.RULE("schemaParser", () => {
      const nodes: Schema["nodes"] = new Map(),
        relations: Schema["relations"] = new Map();

      this.MANY(() => {
        this.OR([
          {
            ALT: () => {
              const node: NodeApp = this.SUBRULE(this.rules.nodeDeclaration);

              node && nodes.set(node.identifier, node);
            },
          },
          {
            ALT: () => {
              const relation: RelationApp = this.SUBRULE(
                this.rules.relationDeclaration
              );

              relation && relations.set(relation.identifier, relation);
            },
          },
        ]);
      });

      return { nodes, relations };
    }),

    nodeDeclaration: this.RULE("nodeDeclaration", () => {
      let properties: ReturnType<
        SchemaParser["rules"]["nodeProperties"]
      > | null = null;

      this.CONSUME(SchemaTokenizer.namedTokens.NodeReserved);
      const identifier = this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBrace);
      this.OPTION(() => {
        properties = this.SUBRULE(this.rules.nodeProperties);
      });
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBrace);

      return {
        identifier: identifier.image,
        ...((properties && { properties }) || {}),
      } as NodeApp;
    }),

    relationDeclaration: this.RULE("relationDeclaration", () => {
      let properties: ReturnType<
        SchemaParser["rules"]["relationProperties"]
      > | null = null;

      this.CONSUME(SchemaTokenizer.namedTokens.RelationshipReserved);
      const identifier = this.CONSUME(SchemaTokenizer.namedTokens.Identifier);

      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBrace);
      this.OPTION(() => {
        properties = this.SUBRULE(this.rules.relationProperties);
      });
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBrace);

      return {
        identifier: identifier.image,
        ...((properties && { properties }) || {}),
      } as RelationApp;
    }),

    nodeProperties: this.RULE("nodeProperties", () => {
      const properties: NodeApp["properties"] = {};

      this.MANY(() => {
        const identifier = this.CONSUME(
          SchemaTokenizer.namedTokens.Identifier
        ).image;
        this.CONSUME(SchemaTokenizer.namedTokens.Colon);
        const property: Property | undefined = this.SUBRULE(
          this.rules.nodeProperty
        );

        if (property) properties[identifier] = property;
      });

      return properties;
    }),

    relationProperties: this.RULE("relationProperties", () => {
      const properties: RelationApp["properties"] = {};

      this.MANY(() => {
        const identifier = this.CONSUME(
          SchemaTokenizer.namedTokens.Identifier
        ).image;
        this.CONSUME(SchemaTokenizer.namedTokens.Colon);
        const property: Property | undefined = this.SUBRULE(
          this.rules.relationProperty
        );

        if (property) properties[identifier] = property;
      });

      return properties;
    }),

    nodeProperty: this.RULE("nodeProperty", () => {
      let relationArguments: { [key: string]: string } | null = null,
        openingBracket: string | null = null,
        closingBracket: string | null = null,
        optionalQuestionMark: string | null = null;

      this.OPTION1(() => {
        openingBracket = this.CONSUME1(
          SchemaTokenizer.namedTokens.OpeningBracket
        ).image;
      });

      const attribute: { type: PropertyTypes; values?: string[] } =
        this.SUBRULE(this.rules.attribute);

      this.OPTION2(() => {
        closingBracket = this.CONSUME1(
          SchemaTokenizer.namedTokens.ClosingBracket
        ).image;
      });

      this.OPTION3(() => {
        optionalQuestionMark = this.CONSUME2(
          SchemaTokenizer.namedTokens.OptionalOperator
        ).image;
      });

      this.OPTION4(() => {
        relationArguments = this.SUBRULE(this.rules.relationArgs);
      });

      if (
        attribute.type !== "relation" &&
        relationArguments &&
        !this.RECORDING_PHASE
      ) {
        throw new Error(
          `Invalid relation arguments\n Expected relation type\n Got: ${attribute.type}`
        );
      }

      return {
        ...attribute,
        ...((!!openingBracket && !!closingBracket && { multiple: true }) || {}),
        ...((!!optionalQuestionMark && {}) || { required: true }),
        ...((!!relationArguments && {
          options: { relation: relationArguments },
        }) ||
          {}),
      } as Property;
    }),

    relationProperty: this.RULE("relationProperty", () => {
      let relationArguments: { [key: string]: string } | null = null,
        openingBracket: string | null = null,
        closingBracket: string | null = null,
        optionalQuestionMark: string | null = null;

      this.OPTION1(() => {
        openingBracket = this.CONSUME1(
          SchemaTokenizer.namedTokens.OpeningBracket
        ).image;
      });

      const attribute: { type: PropertyTypes; values?: string[] } =
        this.SUBRULE(this.rules.attribute);

      this.OPTION2(() => {
        closingBracket = this.CONSUME1(
          SchemaTokenizer.namedTokens.ClosingBracket
        ).image;
      });

      this.OPTION3(() => {
        optionalQuestionMark = this.CONSUME2(
          SchemaTokenizer.namedTokens.OptionalOperator
        ).image;
      });

      this.OPTION4(() => {
        relationArguments = this.SUBRULE(this.rules.relationArgs);
      });

      if (
        attribute.type !== "relation" &&
        relationArguments &&
        !this.RECORDING_PHASE
      ) {
        throw new Error(
          `Invalid relation arguments\n Expected relation type\n Got: ${attribute.type}`
        );
      }

      return {
        ...attribute,
        ...((!!openingBracket && !!closingBracket && { multiple: true }) || {}),
        ...((!!optionalQuestionMark && {}) || { required: true }),
        ...((!!relationArguments && {
          options: { relation: relationArguments },
        }) ||
          {}),
      } as Property;
    }),

    attribute: this.RULE("attribute", () => {
      return this.OR([
        { ALT: () => this.SUBRULE(this.rules.stringAttribute) },
        { ALT: () => this.SUBRULE(this.rules.integerAttribute) },
        { ALT: () => this.SUBRULE(this.rules.decimalAttribute) },
        { ALT: () => this.SUBRULE(this.rules.datetimeAttribute) },
        { ALT: () => this.SUBRULE(this.rules.dateAttribute) },
        { ALT: () => this.SUBRULE(this.rules.timeAttribute) },
        { ALT: () => this.SUBRULE(this.rules.enumAttribute) },
        { ALT: () => this.SUBRULE(this.rules.relationAttribute) },
        { ALT: () => this.SUBRULE(this.rules.booleanAttribute) },
        { ALT: () => this.SUBRULE(this.rules.timestampAttribute) },
        { ALT: () => this.SUBRULE(this.rules.localdatetimeAttribute) },
        { ALT: () => this.SUBRULE(this.rules.localtimeAttribute) },
        { ALT: () => this.SUBRULE(this.rules.pointAttribute) },
      ]);
    }),

    pointAttribute: this.RULE("pointAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.PointReserved);

      return { type: "point" as PropertyTypes };
    }),

    localdatetimeAttribute: this.RULE("localdatetimeAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.LocalDatetimeReserved);

      return { type: "localdatetime" as PropertyTypes };
    }),

    localtimeAttribute: this.RULE("localtimeAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.LocalTimeReserved);

      return { type: "localtime" as PropertyTypes };
    }),

    timestampAttribute: this.RULE("timestampAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.TimestampReserved);

      return { type: "timestamp" as PropertyTypes };
    }),

    booleanAttribute: this.RULE("booleanAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.BooleanReserved);

      return { type: "boolean" as PropertyTypes };
    }),

    stringAttribute: this.RULE("stringAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.StringReserved);

      return { type: "string" as PropertyTypes };
    }),

    integerAttribute: this.RULE("integerAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.IntegerReserved);

      return { type: "integer" as PropertyTypes };
    }),

    decimalAttribute: this.RULE("decimalAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.DecimalReserved);

      return { type: "decimal" as PropertyTypes };
    }),

    datetimeAttribute: this.RULE("datetimeAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.DateTimeReserved);

      return { type: "datetime" as PropertyTypes };
    }),

    dateAttribute: this.RULE("dateAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.DateReserved);

      return { type: "date" as PropertyTypes };
    }),

    timeAttribute: this.RULE("timeAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.TimeReserved);

      return { type: "time" as PropertyTypes };
    }),

    enumAttribute: this.RULE("enumAttribute", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.EnumReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBrace);
      const permittedValues = this.SUBRULE(this.rules.enumValues);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBrace);

      return { type: "enum" as PropertyTypes, values: permittedValues };
    }),

    enumValues: this.RULE("enumValues", () => {
      // Enum { 'a', 'b', 'c' }, value as any literal
      const values: string[] = [];

      this.MANY_SEP({
        SEP: SchemaTokenizer.namedTokens.Comma,
        DEF: () => {
          const value = this.OR([
            {
              ALT: () =>
                this.CONSUME(SchemaTokenizer.namedTokens.StringLiteral),
            },
            {
              ALT: () =>
                this.CONSUME(SchemaTokenizer.namedTokens.IntegerLiteral),
            },
            {
              ALT: () =>
                this.CONSUME(SchemaTokenizer.namedTokens.DecimalLiteral),
            },
            {
              ALT: () => this.CONSUME(SchemaTokenizer.namedTokens.DateLiteral),
            },
            {
              ALT: () =>
                this.CONSUME(SchemaTokenizer.namedTokens.DateTimeLiteral),
            },
            {
              ALT: () => this.CONSUME(SchemaTokenizer.namedTokens.TimeLiteral),
            },
            {
              ALT: () =>
                this.CONSUME(SchemaTokenizer.namedTokens.LocationLiteral),
            },
          ]);
          values.push(value.image);
        },
      });

      return values;
    }),

    relationAttribute: this.RULE("relationAttribute", () => {
      const identifier = this.CONSUME(SchemaTokenizer.namedTokens.Identifier);

      return { type: "relation" as PropertyTypes, node: identifier.image };
    }),

    relationArgs: this.RULE("relationArgs", () => {
      // @relation(name: "name", direction: "IN")
      this.CONSUME(SchemaTokenizer.namedTokens.FunctionOperator);
      this.CONSUME(SchemaTokenizer.namedTokens.RelationReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningParenthesis);
      const args: { [key: string]: string } = this.SUBRULE(
        this.rules.relationArgsList
      );
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingParenthesis);

      return args;
    }),

    relationArgsList: this.RULE("relationArgsList", () => {
      const args: { [key: string]: string } = {};

      this.MANY_SEP({
        SEP: SchemaTokenizer.namedTokens.Comma,
        DEF: () => {
          const argument: { name: string; value: string } = this.SUBRULE(
            this.rules.relationArg
          );
          args[argument.name] = argument.value;
        },
      });

      if (args["direction"] === undefined && !this.RECORDING_PHASE)
        args["direction"] = "BOTH";

      return args;
    }),

    relationArg: this.RULE("relationArg", () => {
      const parameter = this.CONSUME(
        SchemaTokenizer.namedTokens.Identifier
      ).image;
      if (
        !SchemaTokenizer.relationParams.includes(parameter) &&
        !this.RECORDING_PHASE
      ) {
        throw new Error(
          `Invalid relation argument\n Expected one of: ${SchemaTokenizer.relationParams.join(
            ", "
          )}\n Got: ${parameter}`
        );
      }

      this.CONSUME(SchemaTokenizer.namedTokens.Colon);

      const value = this.OR2([
        {
          ALT: () => this.CONSUME(SchemaTokenizer.namedTokens.StringLiteral),
        },
        {
          ALT: () =>
            this.OR3([
              {
                ALT: () =>
                  this.CONSUME(SchemaTokenizer.namedTokens.DirectionINReserved),
              },
              {
                ALT: () =>
                  this.CONSUME(
                    SchemaTokenizer.namedTokens.DirectionOUTReserved
                  ),
              },
              {
                ALT: () =>
                  this.CONSUME(
                    SchemaTokenizer.namedTokens.DirectionBOTHReserved
                  ),
              },
            ]),
        },
      ]);

      return { name: parameter, value: value.image };
    }),
  } as const;
  #schema: Schema | null = null;
  #config: ParserConfig | null = null;

  constructor(overrideConfig?: ParserConfig) {
    // instantiate the parser with the tokens from the tokenizer
    overrideConfig = { ...overrideConfig, recoveryEnabled: true };
    super(SchemaTokenizer.allTokens, overrideConfig);

    this.performSelfAnalysis();
    this.#config = overrideConfig;
  }

  parse() {
    if (this.input.length === 0) {
      throw new Error("No input provided");
    }

    // @ts-expect-error
    const schema: Schema | undefined = this.schemaParser();

    if (!schema || this.errors.length > 0) {
      throw new Error(`Invalid schema, check the errors above\n${this.errors}`);
    }

    if (this.#config?.debug && this.#config.outputPath) {
      createDebugFile(
        this.#config.outputPath,
        "schema.json",
        JSON.stringify(
          {
            nodes: Object.fromEntries(schema.nodes),
            relations: Object.fromEntries(schema.relations),
          },
          null,
          2
        )
      );
    }

    this.#schema = schema;
  }

  get schema(): Schema | null {
    return this.#schema;
  }
}

export default SchemaParser;
