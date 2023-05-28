import { describe, it } from "mocha";
import { expect } from "chai";
import OGM from "../../src/index";

describe("Create instance using .env variables", () => {
  const ogm = OGM.fromEnv();

  after(() => {
    ogm.close();
  });

  it("should be an instance of OGM", () => {
    expect(ogm).to.be.an.instanceof(OGM);
  });
});
