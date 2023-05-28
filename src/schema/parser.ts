import { CstParser, ILexingResult } from "chevrotain";
import SchemaTokenizer from "./lexer";

/**
 * Responsible for parsing the schema file and generate the schema of the database.
 *
 * Using the Chevrotain parser generator to consume the tokens from the tokenizer.
 */
class SchemaParser extends CstParser {
  /**
   * Rules for Schema Language.
   */
  #rules = {
    schema: this.RULE("schema", () => {
      this.MANY(() => {
        this.SUBRULE(this.#rules.nodeDeclaration);
      });
      this.MANY2(() => {
        this.SUBRULE(this.#rules.relationAttribute);
      });
    }),

    /**
     * Relation declaration rule.
     *
     * Relation as a edge between two nodes. could be directed or undirected, and could have multiple properties.
     */
    relationDeclaration: this.RULE("relationDeclaration", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.RelationReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBrace);
      this.SUBRULE(this.#rules.relationProperties);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBrace);
    }),

    relationProperties: this.RULE("relationProperties", () => {
      this.MANY(() => {
        this.SUBRULE(this.#rules.anyAttribute);
      });
    }),

    /**
     * Node declaration rule.
     */
    nodeDeclaration: this.RULE("nodeDeclaration", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.NodeReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBrace);
      this.SUBRULE(this.#rules.nodeProperties);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBrace);
    }),

    nodeProperties: this.RULE("nodeProperties", () => {
      this.MANY(() => {
        this.SUBRULE(this.#rules.nodeProperty);
      });
    }),

    nodeProperty: this.RULE("nodeProperty", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.Colon);
      this.SUBRULE(this.#rules.nodePropertyType);
    }),

    nodePropertyType: this.RULE("nodePropertyType", () => {
      this.SUBRULE(this.#rules.anyAttribute, { LABEL: "required" });
      this.OPTION(() => {
        this.SUBRULE(this.#rules.optionalLiteral, { LABEL: "optional" });
      });
    }),

    /**
     * Attribute rules.
     */
    anyAttribute: this.RULE("anyAttribute", () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.StringLiteral, {
              LABEL: "String_attribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.IntegerLiteral, {
              LABEL: "Integer_attribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DecimalLiteral, {
              LABEL: "Decimal_attribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DateLiteral, {
              LABEL: "Date_attribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DateTimeLiteral, {
              LABEL: "DateTime_attribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.TimeLiteral, {
              LABEL: "Time_attribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.LocationLiteral, {
              LABEL: "Location_attribute",
            });
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.#rules.nodeEnum, {
              LABEL: "node_enum_attribute",
            });
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.#rules.relationAttribute, {
              LABEL: "node_relation_attribute",
            });
          },
        },
      ]);
    }),

    relationAttributeArgs: this.RULE("relationAttributeArgs", () => {
      this.CONSUME1(SchemaTokenizer.namedTokens.FunctionOperator);
      this.CONSUME2(SchemaTokenizer.namedTokens.RelationReserved);
      this.CONSUME3(SchemaTokenizer.namedTokens.OpeningParenthesis);
      this.CONSUME4(SchemaTokenizer.namedTokens.Identifier, { LABEL: "name" });
      this.CONSUME5(SchemaTokenizer.namedTokens.Colon);
      this.CONSUME6(SchemaTokenizer.namedTokens.StringLiteral);
      this.CONSUME7(SchemaTokenizer.namedTokens.Common);
      this.CONSUME8(SchemaTokenizer.namedTokens.Identifier, {
        LABEL: "direction",
      });
      this.OR([
        {
          ALT: () => {
            this.CONSUME9(SchemaTokenizer.namedTokens.DirectionINReserved);
          },
        },
        {
          ALT: () => {
            this.CONSUME9(SchemaTokenizer.namedTokens.DirectionOUTReserved);
          },
        },
        {
          ALT: () => {
            this.CONSUME9(SchemaTokenizer.namedTokens.DirectionBOTHReserved);
          },
        },
      ]);
      this.CONSUME9(SchemaTokenizer.namedTokens.ClosingParenthesis);
    }),

    optionalLiteral: this.RULE("optionalLiteral", () => {
      this.SUBRULE(this.#rules.anyAttribute, { LABEL: "optional_attribute" });
      this.CONSUME(SchemaTokenizer.namedTokens.OptionalOperator, {
        LABEL: "optional_question_mark",
      });
    }),

    optionalRelation: this.RULE("optionalRelation", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.OptionalOperator);
    }),

    multipleRelation: this.RULE("multipleRelation", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBracket);
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBracket);
    }),

    relationAttribute: this.RULE("relationAttribute", () => {
      this.OR([
        {
          ALT: () => {
            this.SUBRULE(this.#rules.optionalRelation, {
              LABEL: "optional_relation",
            });
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.#rules.multipleRelation, {
              LABEL: "multiple_relation",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.Identifier, {
              LABEL: "node_relation_attribute",
            });
          },
        },
      ]);
    }),

    nodeEnum: this.RULE("nodeEnum", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.EnumReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBracket);
      this.SUBRULE(this.#rules.nodeEnumValues);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBracket);
    }),

    nodeEnumValues: this.RULE("nodeEnumValues", () => {
      // catch any values inside the brackets
      this.MANY(() => {
        this.SUBRULE(this.#rules.anyAttribute);
      });
    }),
  };

  constructor(tokens: ILexingResult["tokens"]) {
    // instantiate the parser with the tokens from the tokenizer
    super(SchemaTokenizer.allTokens, { recoveryEnabled: true });

    this.performSelfAnalysis();

    // introduce the tokens to the parser
    this.input = tokens;

    // set the parser's start rule
    this.#initParser();
  }

  /**
   * Parse the schema file.
   */
  #initParser = () => {
    // call the start rule
    // @ts-ignore
    this.schema();
  };
}

export default SchemaParser;
