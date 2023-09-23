import { describe, it, setup } from "mocha";
import { expect } from "chai";

import { OGM } from "../../../src/app";
import { Model } from "../../../src/models";
import { PropertyType } from "../../../src/types/lexer";
import { ProvidedPropertiesFactory } from "../../../src/types/models";

interface User {
  id: number;
  name: string;
}

type UserModelProperties = ProvidedPropertiesFactory<keyof User & string, "id">;

describe("Model", () => {
  let model: Model<User, UserModelProperties>;

  setup(async () => {
    return new Promise(async (resolve) => {
      const app = await OGM.fromEnv();

      model = new Model(app, "User", {
        labels: ["User"],
        properties: {
          id: {
            type: PropertyType.integer,
            unique: true,
            required: true,
            readonly: true,
          },
          name: { type: PropertyType.string, required: true },
        },
      });

      resolve();
    });
  });

  describe("#create", () => {
    it("It must create a node", async () => {
      return new Promise(async (resolve) => {
        const newEntity = await model.create({
          name: "John Doe",
          id: 12,
        });

        expect(model).to.has.property("name");
        expect(newEntity).to.has.property("id");
        expect(newEntity.get("name")).to.be.equal("John Doe");

        resolve();
      });
    });
  });

  describe("#all", () => {
    it("It must return all model nodes", async () => {
      const nodesMap = await model.all();

      expect(nodesMap).to.be.an("map");
      expect(nodesMap.size).to.be.greaterThan(0);
    });

    it("It must return first 2 model nodes", async () => {
      const nodesMap = await model.all({ limit: 2 });

      expect(nodesMap).to.be.an("map");
      expect(nodesMap.size).to.be.equal(2);
    });
  });

  describe("#find", () => {
    it("It must return a model node", async () => {
      const node = await model.find(12);

      expect(node).to.be.an("object");
      expect(node.get("name")).to.be.equal("John Doe");
    });
  });
});
