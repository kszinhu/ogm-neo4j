import { describe, it, setup } from "mocha";
import { expect } from "chai";

import Builder from "../../../src/query/builder";
import { OGM } from "../../../src/app";

describe("Return Statement on QueryBuilder", () => {
  let QueryBuilder: Builder;

  setup(async () => {
    return new Promise(async (resolve) => {
      const app = await OGM.fromEnv();

      QueryBuilder = new Builder(app);

      resolve();
    });
  });

  it("It must return a full match query", () => {
    const query = QueryBuilder.match(
      "u",
      "User",
      new Map([
        [
          "name",
          {
            multiple: false,
            value: "John Doe",
            type: "string",
            readonly: false,
            required: true,
            unique: false,
            properties: undefined,
            defaultValue: undefined,
            supportedValues: undefined,
            target: undefined,
          },
        ],
      ])
    ).return("u");

    const buildedQuery = query.build();

    expect(buildedQuery).to.has.property("query");
    expect(buildedQuery).to.has.property("params");
    expect(buildedQuery.query).to.eql(
      "MATCH (u:User{ name : $u_name })\nRETURN u"
    );
  });
});
