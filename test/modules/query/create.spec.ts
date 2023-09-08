import { describe, it, setup } from "mocha";
import { expect } from "chai";

import Builder from "../../../src/query/builder";
import { OGM } from "../../../src/app";

describe("Create", () => {
  let QueryBuilder: Builder;

  setup(() => {
    const app = OGM.fromEnv();

    QueryBuilder = new Builder(app);
  });

  it("It must be instantiable", () => {
    expect(QueryBuilder).instanceOf(Builder);
  });

  it("It must create a node", () => {
    const query = QueryBuilder.create(
      "u",
      "User",
      new Map([
        [
          "name",
          {
            type: "string",
            defaultValue: "",
            readonly: false,
            required: true,
            unique: false,
          },
        ],
      ])
    );

    debugger;

    expect(query).instanceOf(Builder);
    expect(query.toString()).to.be.equal(
      "CREATE (u:User {name: $u_name}) RETURN u"
    );
  });
});
