import { describe, it, suite, setup } from "mocha";
import { expect } from "chai";
import SchemaParser from "../../../src/schema/parser";
import SchemaTokenizer from "../../../src/schema/lexer";

describe("Parser", () => {
  let Tokenizer: SchemaTokenizer;

  setup(() => {
    Tokenizer = new SchemaTokenizer(
      "test/modules/schema/mocks/schema_example.ogm"
    );
  });

  it("It must be instantiable", () => {
    const Parser = new SchemaParser(Tokenizer.MappedTokens);

    expect(Parser).instanceOf(SchemaParser);
  });
});
