import { Session } from "neo4j-driver";
import OGM from "@app/app";
import { ApplicationLexer, ApplicationParser } from "./index";
import { SchemaOfApplication } from "../types/parser";
import { Model } from "@models/index";
import consoleMessage from "@utils/cliMessages";

type Query =
  | string
  | String
  | {
      text: string;
      parameters?: any;
    };

class Schema {
  #app: OGM;
  #parsedSchema: SchemaOfApplication;

  constructor(app: OGM) {
    this.#app = app;
    const parser = new ApplicationParser(),
      tokenizer = new ApplicationLexer(app.schemaPath);

    parser.input = tokenizer.tokenizedSchema;
    parser.parse();

    if (!parser.schema || parser.errors.length) throw new Error("Schema error");

    this.#parsedSchema = parser.schema;
  }

  install() {
    consoleMessage({ message: "[OGM] Applying schema..." });

    return this.#installSchema(this.#app);
  }

  drop() {
    consoleMessage({ message: "[OGM] Dropping schema..." });

    return this.#dropSchema(this.#app);
  }

  #installSchema(app: OGM) {
    const queries: string[] = [];

    this.#parsedSchema.nodes.forEach((node) => {
      consoleMessage({
        message: `Node: ${node.identifier}`,
        type: "debug",
      });

      const nodeModel = new Model(app, node.identifier, {
        labels: [node.identifier],
        properties: node.properties as any,
      });

      consoleMessage({
        message: `Define Model: ${nodeModel.name}`,
        type: "debug",
      });

      app.models.set(node.identifier, nodeModel);
    });

    this.#parsedSchema.relations.forEach((relation) => {
      consoleMessage({
        message: `Relation: ${relation.identifier}`,
        type: "debug",
      });

      const relationModel = new Model(app, relation.identifier, {
        labels: [relation.identifier],
        properties: relation.properties as any,
      });

      app.models.set(relation.identifier, relationModel);
    });

    app.models.forEach((model, name) => {
      model.properties.forEach((property) => {
        if (property.unique) {
          queries.push(this.#constraints.unique(name, property.name, "CREATE"));
        } else if (property.required) {
          queries.push(this.#constraints.exists(name, property.name, "CREATE"));
        }
        // TODO: add index schema support
      });
    });

    return app.batch(queries);
  }

  #dropSchema(app: OGM) {
    const queries: string[] = [];

    app.models.forEach((model, name) => {
      model.properties.forEach((property) => {
        if (property.unique) {
          queries.push(this.#constraints.unique(name, property.name, "DROP"));
        } else if (property.required) {
          queries.push(this.#constraints.exists(name, property.name, "DROP"));
        }
        // TODO: add index schema support
      });
    });

    const session = app.writeSession();

    return new Promise((resolve, reject) => {
      this.#run(session, queries, resolve, reject);
    });
  }

  #run(session: Session, queries: Query[], resolve: any, reject: any) {
    const next = queries.pop();

    if (!next) {
      return resolve();
    }

    return session
      .run(next)
      .then(() => {
        if (queries.length) {
          return this.#run(session, queries, resolve, reject);
        }

        session.close();
        resolve();
      })
      .catch((e) => {
        reject(e);
      });
  }

  // #transformSchema(
  //   schema: SchemaOfApplication["nodes"] | SchemaOfApplication["relations"]
  // ) {
  //   schema.forEach((model) => {
  //     // if
  //     Object.entries(model.properties).forEach(
  //       ([propertyIdentifier, propertyConfig]) => {
  //         // if propertyConfig.type is "enum" change values to "supportedValues"
  //         return {
  //           ...propertyConfig,
  //           default: propertyConfig.default ?? false,
  //           required: propertyConfig.required ?? false,
  //           unique: propertyConfig.unique ?? false,
  //           multiple: propertyConfig.multiple ?? false,
  //           relation: propertyConfig.relation,
  //           type: propertyConfig.type,
  //           values: propertyConfig.values ?? [],
  //         } as unknown as ProvidedPropertiesFactory<keyof typeof propertyConfig & string>;
  //       }
  //     );
  //   });
  // }

  #constraints = {
    unique: (label: string, property: string, mode: string = "CREATE") => {
      return `${mode} CONSTRAINT ON (model:${label}) ASSERT model.${property} IS UNIQUE`;
    },
    exists: (label: string, property: string, mode: string = "CREATE") => {
      return `${mode} CONSTRAINT ON (model:${label}) ASSERT EXISTS(model.${property})`;
    },
    index: (label: string, property: string, mode: string = "CREATE") => {
      return `${mode} INDEX ON :${label}(${property})`;
    },
  };
}

export default Schema;
