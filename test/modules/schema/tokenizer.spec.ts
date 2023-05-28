import { describe, it, suite } from "mocha";
import { expect } from "chai";
import SchemaTokenizer from "../../../src/schema/lexer";

describe("Tokenizer", () => {
  let Tokenizer: SchemaTokenizer;

  it("It must be instantiable", () => {
    Tokenizer = new SchemaTokenizer(
      "test/modules/schema/mocks/schema_example.ogm"
    );

    expect(Tokenizer).instanceOf(SchemaTokenizer);
    expect(Tokenizer).to.have.property("MappedTokens");
  });

  it("Should tokenize a comment, but not include it in the result", () => {
    Tokenizer = new SchemaTokenizer(
      "test/modules/schema/mocks/schema_comment.ogm"
    );

    expect(Tokenizer.MappedTokens).to.be.an("array");
    expect(Tokenizer.MappedTokens).to.have.lengthOf(0);
  });

  it("Should tokenize a node definition", () => {
    Tokenizer = new SchemaTokenizer(
      "test/modules/schema/mocks/schema_node.ogm"
    );

    expect(Tokenizer.MappedTokens).to.be.an("array");
    expect(Tokenizer.MappedTokens[0]).to.have.property("image", "Node");
    expect(Tokenizer.MappedTokens[1]).to.have.property("image", "User");
    expect(Tokenizer.MappedTokens[2]).to.have.property("image", "{");
    expect(Tokenizer.MappedTokens[3]).to.have.property("image", "id");
    expect(Tokenizer.MappedTokens[4]).to.have.property("image", ":");
    expect(Tokenizer.MappedTokens[5]).to.have.property("image", "String");
    expect(Tokenizer.MappedTokens[46]).to.have.property("image", "@");
    expect(Tokenizer.MappedTokens[47]).to.have.property("image", "relation");
  });
});
