import { BaseParser, CstParser, ILexingResult, Rule } from "chevrotain";
import SchemaTokenizer from "./lexer";
import { Schema } from "zod";

// { name: 'schema', children: { nodeDeclaration?: [Array], relationDeclaration?: [Array] } }
type ParsedSchema<R extends Record<string, any>> = {
  name: "schema";
  children: {
    [key in keyof R]?: R[key][];
  };
};

/**
 * Responsible for parsing the schema file and generate the schema of the database.
 *
 * Using the Chevrotain parser generator to consume the tokens from the tokenizer.
 */
class SchemaParser extends CstParser {
  /**
   * Rules for Schema Language.
   */
  private rules = {
    schema: this.RULE("schema", () => {
      this.MANY(() => {
        this.OR([
          {
            ALT: () => {
              this.SUBRULE(this.rules.nodeDeclaration);
            },
          },
          {
            ALT: () => {
              this.SUBRULE(this.rules.relationDeclaration);
            },
          },
        ]);
      });
    }),

    /**
     * Relation declaration rule.
     *
     * Relation as a edge between two nodes. could be directed or undirected, and could have multiple properties.
     */
    relationDeclaration: this.RULE("relationDeclaration", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.RelationshipReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBrace);
      this.SUBRULE(this.rules.relationProperties);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBrace);
    }),

    relationProperties: this.RULE("relationProperties", () => {
      this.MANY(() => {
        this.SUBRULE(this.rules.anyAttribute);
      });
    }),

    /**
     * Node declaration rule.
     */
    nodeDeclaration: this.RULE("nodeDeclaration", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.NodeReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBrace);
      this.SUBRULE(this.rules.nodeProperties);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBrace);
    }),

    nodeProperties: this.RULE("nodeProperties", () => {
      this.MANY(() => {
        this.SUBRULE(this.rules.nodeProperty);
      });
    }),

    nodeProperty: this.RULE("nodeProperty", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier);
      this.CONSUME(SchemaTokenizer.namedTokens.Colon);
      this.SUBRULE(this.rules.nodePropertyType);
    }),

    nodePropertyType: this.RULE("nodePropertyType", () => {
      this.SUBRULE(this.rules.anyAttribute, { LABEL: "attribute" });
      this.OPTION(() => {
        this.CONSUME(SchemaTokenizer.namedTokens.OptionalOperator, {
          LABEL: "optionalQuestionMark",
        });
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
              LABEL: "StringAttribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.IntegerLiteral, {
              LABEL: "IntegerAttribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DecimalLiteral, {
              LABEL: "DecimalAttribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DateLiteral, {
              LABEL: "DateAttribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DateTimeLiteral, {
              LABEL: "DateTimeAttribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.TimeLiteral, {
              LABEL: "TimeAttribute",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.LocationLiteral, {
              LABEL: "LocationAttribute",
            });
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.rules.nodeEnum, {
              LABEL: "nodeEnumAttribute",
            });
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.rules.relationAttribute, {
              LABEL: "nodeRelationAttribute",
            });
          },
        },
      ]);
    }),

    relationAttributeArgs: this.RULE("relationAttributeArgs", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.FunctionOperator);
      this.CONSUME(SchemaTokenizer.namedTokens.RelationReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningParenthesis);
      this.CONSUME(SchemaTokenizer.namedTokens.RelationArgNameReserved, {
        ERR_MSG: "Argument name must be a exist",
      });
      this.CONSUME(SchemaTokenizer.namedTokens.Colon);
      this.CONSUME(SchemaTokenizer.namedTokens.Identifier, {
        ERR_MSG: "Relation name must be a string",
      });
      this.CONSUME(SchemaTokenizer.namedTokens.Comma);
      this.CONSUME(SchemaTokenizer.namedTokens.RelationArgDirectionReserved, {
        ERR_MSG: "Argument direction must be a exist",
      });
      this.CONSUME2(SchemaTokenizer.namedTokens.Colon);
      this.CONSUME2(SchemaTokenizer.namedTokens.Identifier, {
        LABEL: "direction",
      });
      this.OR([
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DirectionINReserved);
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DirectionOUTReserved);
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.DirectionBOTHReserved);
          },
        },
      ]);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingParenthesis);
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
            this.SUBRULE(this.rules.optionalRelation, {
              LABEL: "optionalRelation",
            });
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.rules.multipleRelation, {
              LABEL: "multipleRelation",
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(SchemaTokenizer.namedTokens.Identifier, {
              LABEL: "nodeRelationAttribute",
            });
          },
        },
      ]);
      // optional relation attribute arguments (e.g. @relation(name: "my_relation", direction: 'out'))
      this.OPTION(() => {
        this.SUBRULE(this.rules.relationAttributeArgs);
      });
    }),

    nodeEnum: this.RULE("nodeEnum", () => {
      this.CONSUME(SchemaTokenizer.namedTokens.EnumReserved);
      this.CONSUME(SchemaTokenizer.namedTokens.OpeningBrace);
      this.SUBRULE(this.rules.nodeEnumValues);
      this.CONSUME(SchemaTokenizer.namedTokens.ClosingBrace);
    }),

    nodeEnumValues: this.RULE("nodeEnumValues", () => {
      // catch any values inside the brackets
      this.MANY(() => {
        this.SUBRULE(this.rules.anyAttribute);
        // optional comma ',' after each value
        this.OPTION(() => {
          this.CONSUME(SchemaTokenizer.namedTokens.Comma);
        });
      });
    }),
  } as const;

  constructor() {
    // instantiate the parser with the tokens from the tokenizer
    super(SchemaTokenizer.allTokens, { recoveryEnabled: true });

    this.performSelfAnalysis();
  }

  parseSchema(): ParsedSchema<InstanceType<typeof SchemaParser>["rules"]> {
    if (this.input.length === 0) {
      throw new Error("No input provided");
    }

    // @ts-expect-error
    return this.schema();
  }
}

export default SchemaParser;
