import dotenv from "dotenv";
import neo4j, {
  Driver,
  Config,
  SessionMode,
  Session,
  Transaction,
  QueryResult,
  int,
  Integer,
} from "neo4j-driver";

import { searchOnDirectory } from "@utils/index";
import ModelMap from "@models/map";
import QueryBuilder from "@query/builder";
import { Database } from "@config/index";
import { Model } from "@models/index";
import { Schema } from "@schema/index";
import { TransactionError } from "@errors/index";
import { DatabaseConstructorParams } from "@config/database";

export default class OGM {
  version = process.env.npm_package_version ?? "0.0.1";
  agentName = `OGM/${this.version}`;

  // @ts-expect-error
  #database: Database;
  // @ts-expect-error
  schema: Schema;
  // @ts-expect-error
  schemaPath: string;
  models: ModelMap<Record<string, Model<any, any>>>;

  /**
   * The constructor of the OGM class.
   */
  constructor() {
    this.models = new ModelMap(this);

    if (process.env.NODE_ENV !== "test") {
      this.schemaPath = searchOnDirectory(process.cwd());
      this.schema = new Schema(this);
    }
  }

  static async build(
    connectionString: string,
    username: string,
    password: string,
    config: Config
  ): Promise<OGM> {
    const app = new OGM();

    await app
      .#setDatabase({
        config,
        username,
        password,
        host: connectionString.split("//")[1].split(":")[0],
        port: parseInt(connectionString.split(":")[2].split("/")[0]),
        protocol: connectionString.split(":")[0],
        database: connectionString.split("/")[3] ?? "neo4j",
      })
      .then(() => {
        if (process.env.NODE_ENV !== "test") app.schema.install();
      });

    return app;
  }

  async #setDatabase(args: DatabaseConstructorParams) {
    this.#database = await Database.init(this, args);
  }

  /**
   * Generate instance using .env file configuration
   */
  static async fromEnv(): Promise<OGM> {
    dotenv.config();

    const connectionString =
        process.env.NEO4J_CONNECTION_STRING ??
        `${process.env.NEO4J_PROTOCOL}://${process.env.NEO4J_HOST}:${
          process.env.NEO4J_PORT
        }/${process.env.NEO4J_DATABASE ?? "neo4j"}`,
      username = process.env.NEO4J_USERNAME,
      password = process.env.NEO4J_PASSWORD;

    if (!username || !password)
      throw new Error("Username or password is missing");

    return await OGM.build(connectionString, username, password, {});
  }

  /**
   * Close the connection to the database.
   */
  close(): void {
    this.#database.close();
  }

  /**
   * Run a cypher query
   */
  cypher(
    query: string,
    params: Record<string, any> = {},
    session: false | Session = false
  ) {
    const driver = session ? session : this.readSession();

    return driver
      .run(query, params)
      .then((response) => {
        if (!session) driver.close();

        return response;
      })
      .catch((error) => {
        if (!session) driver.close();

        error.query = query;
        error.params = params;

        throw error;
      });
  }

  /**
   * Run a cypher query in write mode.
   */
  writeCypher(query: string, params: Record<string, any> = {}) {
    return this.cypher(query, params, this.writeSession());
  }

  /**
   * Get the session of the database.
   */
  session(mode: SessionMode = neo4j.session.READ): Session {
    return this.#database.session(mode);
  }

  /**
   * Get the read session of the database.
   */
  readSession(): Session {
    return this.session(neo4j.session.READ);
  }

  /**
   * Get the write session of the database.
   */
  writeSession(): Session {
    return this.session(neo4j.session.WRITE);
  }

  /**
   * Create a transaction.
   */
  transaction(): Transaction & { success: () => Promise<void> } {
    const session = this.#database.session();

    // @ts-expect-error
    const transaction: Transaction & { success: () => Promise<void> } =
      session.beginTransaction();

    transaction.success = async () => {
      await transaction.commit();
      session.close();
    };

    return transaction;
  }

  /**
   * Run a batch of queries.
   */
  async batch(
    queries:
      | { query: string; params: Record<string, string | number> }[]
      | string[]
  ): Promise<QueryResult[]> {
    const transaction = this.transaction();
    const output: QueryResult[] = [];
    const errors: { query: string; params: any; error: unknown }[] = [];

    await Promise.all(
      queries.map((query) => {
        if (!query) throw new Error("Query is required");

        const params =
          typeof query === "object" && "params" in query ? query.params : {};
        query =
          typeof query === "object" && "query" in query ? query.query : query;

        try {
          return transaction
            .run(query, params)
            .then((res) => {
              output.push(res);
            })
            .catch((error) => {
              errors.push({ query, params, error });
            });
        } catch (error: unknown) {
          errors.push({ query, params, error });
        }
      })
    );

    if (errors.length) {
      transaction.rollback();

      const causes = errors.map(({ error: cause }) => cause as string),
        message = `Error running batch of queries -> ${causes}`;

      throw new TransactionError({ message, cause: causes.join("\n") });
    }

    await transaction.success();

    return output;
  }

  /**
   * Retrieve a model.
   */
  retrieveModel<M extends Model<any, any>>(name: string): M {
    const model = this.models.get(name);

    if (!model) throw new Error(`Model ${name} not found`);

    return model as M;
  }

  /**
   * Return a query builder.
   */
  query(): QueryBuilder {
    return new QueryBuilder(this);
  }

  /**
   * Change the database.
   */
  useDatabase(database: string): void {
    this.#database.useDatabase(database);
  }

  /**
   * Convert neo4j integer to number.
   */
  static toNumber(value: number): Integer {
    return int(value);
  }
}
