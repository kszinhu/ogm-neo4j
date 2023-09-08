import { describe, it, setup } from "mocha";
import { expect } from "chai";
import { ApplicationParser, ApplicationLexer } from "../../../src/schema";

describe("Parser", () => {
  let Tokenizer: ApplicationLexer;

  setup(() => {
    Tokenizer = new ApplicationLexer(
      "test/modules/schema/mocks/schema_example.ogm"
    );
  });

  it("It must be instantiable", () => {
    const parser = new ApplicationParser();

    expect(parser).instanceOf(ApplicationParser);
  });

  it("It must parse the schema file", () => {
    const parser = new ApplicationParser({ debug: true, outputPath: "./tmp/" });
    parser.input = Tokenizer.tokenizedSchema;
    parser.parse();

    expect(parser.schema).to.be.has.property("nodes");
    expect(parser.schema).to.be.has.property("relations");
    expect(parser.schema).to.be.has.property("nodes").that.is.an("Map");
    expect(parser.schema).to.be.has.property("nodes").that.has.lengthOf(10);
  });
});
