import { describe, it, setup } from "mocha";
import { expect } from "chai";
import SchemaParser from "../../../src/schema/parser";
import SchemaTokenizer from "../../../src/schema/lexer";

describe("Parser", () => {
  let tokenizer: SchemaTokenizer;

  setup(() => {
    tokenizer = new SchemaTokenizer(
      "test/modules/schema/mocks/schema_example.ogm"
    );
  });

  it("It must be instantiable", () => {
    const parser = new SchemaParser();

    expect(parser).instanceOf(SchemaParser);
  });

  it("It must parse the schema file", () => {
    const parser = new SchemaParser();
    parser.input = tokenizer.tokenizedSchema;
    const schema = parser.parseSchema();

    expect(schema).to.be.has.property("children");
    expect(schema.children).to.be.has.property("nodeDeclaration");
    expect(schema.children.nodeDeclaration).to.be.has.lengthOf(10);
  });
});
