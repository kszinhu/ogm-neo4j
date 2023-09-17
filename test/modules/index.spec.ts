import { describe, it, setup } from "mocha";
import { expect } from "chai";
import { OGM } from "../../src/app";

describe("Create instance using .env variables", () => {
  let app: OGM;

  setup(async () => {
    return new Promise(async (resolve) => {
      app = await OGM.fromEnv();

      resolve();
    });
  });

  after(() => {
    app.close();
  });

  it("should be an instance of OGM", () => {
    expect(app).to.be.an.instanceof(OGM);
  });
});
