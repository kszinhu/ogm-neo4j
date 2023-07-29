import OGM from "../app/index";
import { Session } from "neo4j-driver";

type Query =
  | string
  | String
  | {
      text: string;
      parameters?: any;
    };

class Schema {
  #app: OGM;

  constructor(app: OGM) {
    this.#app = app;
  }

  install() {
    return this.#installSchema(this.#app);
  }

  drop() {
    return this.#dropSchema(this.#app);
  }

  #installSchema(app: OGM) {
    const queries: string[] = [];

    app.models.forEach((model, name) => {
      model.properties().forEach((property) => {
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
      model.properties().forEach((property) => {
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
