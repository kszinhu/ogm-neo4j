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

import { consoleMessage, searchOnDirectory } from "@utils/index";
import ModelMap from "@models/map";
import QueryBuilder from "@query/builder";
import { Model } from "@models/index";
import { Schema } from "@schema/index";
import { TransactionError } from "@errors/index";

export default class OGM {
  #driver!: Driver;
  models: ModelMap<Record<string, Model<any, any>>>;
  schema: Schema;
  schemaPath: string;

  /**
   * The constructor of the OGM class.
   */
  constructor(
    connectionString: string,
    username: string,
    password: string,
    config: Config
  ) {
    const auth = neo4j.auth.basic(username, password);

    this.schemaPath = searchOnDirectory(process.cwd());
    this.models = new ModelMap(this);
    this.schema = new Schema(this);

    try {
      consoleMessage({ message: "[OGM] Connecting to the database..." });

      this.#driver = neo4j.driver(connectionString, auth, config);
      this.#verifyConnection();
    } catch (error) {
      consoleMessage({
        message: "[OGM] Error connecting to the database",
        type: "error",
        exit: true,
        error: error as string,
      });
    }

    try {
      consoleMessage({
        message: "[OGM] Applying schema...",
      });

      this.schema.install();
    } catch (error) {}
  }

  /**
   * Generate instance using .env file configuration
   *
   * @returns {OGM} - The OGM instance.
   */
  static fromEnv(): OGM {
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

    const default_settings: { [key: string]: string } = {
      NEO4J_ENCRYPTION: "encrypted",
      NEO4J_TRUST: "trust",
      NEO4J_TRUSTED_CERTIFICATES: "trustedCertificates",
      NEO4J_KNOWN_HOSTS: "knownHosts",
      NEO4J_MAX_CONNECTION_POOLSIZE: "maxConnectionPoolSize",
      NEO4J_MAX_TRANSACTION_RETRY_TIME: "maxTransactionRetryTime",
      NEO4J_LOAD_BALANCING_STRATEGY: "loadBalancingStrategy",
      NEO4J_MAX_CONNECTION_LIFETIME: "maxConnectionLifetime",
      NEO4J_CONNECTION_TIMEOUT: "connectionTimeout",
      NEO4J_DISABLE_LOSSLESS_INTEGERS: "disableLosslessIntegers",
      NEO4J_LOGGING_LEVEL: "logging",
    };

    const config = Object.keys(default_settings).reduce((acc, key) => {
      if (process.env[key]) {
        acc[default_settings[key]] = process.env[key] as string;
      }

      return acc;
    }, {} as { [key: string]: string });

    return new OGM(connectionString, username, password, config);
  }

  /* @internal */
  #verifyConnection = async () => {
    try {
      await this.#driver.verifyAuthentication().catch((error) => {
        consoleMessage({
          message: `[OGM] Error connecting to the database \n ${error}`,
          type: "error",
          exit: true,
        });
        process.exit(-1);
      });

      consoleMessage({
        message: "[OGM] Successfully connected to the database",
        type: "success",
      });
    } catch (error) {
      consoleMessage({
        message: `[OGM] Error connecting to the database \n ${error}`,
        type: "error",
        exit: true,
      });
    }
  };

  /**
   * Close the connection to the database.
   */
  close(): void {
    this.#driver.close();
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
    return this.#driver.session({ defaultAccessMode: mode });
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
    const session = this.#driver.session();
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
   * Convert neo4j integer to number.
   */
  static toNumber(value: number): Integer {
    return int(value);
  }
}
