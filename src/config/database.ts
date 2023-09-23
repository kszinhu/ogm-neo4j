import neo4j, {
  AuthToken,
  Config,
  Driver,
  Session,
  SessionMode,
  Transaction,
} from "neo4j-driver";
import { OGM } from "@app/index";
import { consoleMessage } from "@utils/index";
import { resolve as dnsResolver } from "dns";
import { LogLevel } from "@utils/cliMessages";

export interface DatabaseConstructorParams {
  host: string;
  port: number;
  protocol: string;
  database?: string;
  username: string;
  password: string;
  config?: Config;
}

interface DatabaseConfiguration {
  // TODO: add support for multiple hosts
  // TODO: hidden host ip address
  host: string;
  port: number;
  protocol: string;
  databaseName: string;
  driverParams: Config;
  authentication: {
    username: string;
    password: string;
    token: AuthToken;
  };
}

/**
 * Database configuration
 *
 * Responsible for connecting to the database and initialize a schema
 */
export default class Database {
  #app: OGM;
  #configurations: DatabaseConfiguration;
  // @ts-expect-error
  #driver: Driver;
  defaultDriverParams: Config = {
    encrypted: "ENCRYPTION_OFF",
    trust: "TRUST_ALL_CERTIFICATES",
    logging: {
      logger: (level, message) => {
        const normalizeLevel: Record<typeof level, LogLevel> = {
          debug: "debug",
          info: "info",
          error: "error",
          warn: "error",
        };

        consoleMessage({
          message: `[OGM] ${message}`,
          type: normalizeLevel[level],
        });
      },
    },
    disableLosslessIntegers: true,
  };

  constructor(
    app: OGM,
    {
      config,
      database,
      host,
      username,
      password,
      port,
      protocol,
    }: DatabaseConstructorParams
  ) {
    this.#app = app;

    const auth = this.#authenticate(username, password);

    this.#configurations = {
      host,
      port,
      protocol,
      databaseName: database ?? "neo4j",
      driverParams: {
        ...this.defaultDriverParams,
        ...config,
        userAgent: this.#app.agentName,
      },
      authentication: { username, password, token: auth },
    };

    if (process.env.NODE_ENV === "test") this.#setTestConfiguration();
  }

  /**
   * Initialize the database.
   */
  static init(
    app: OGM,
    {
      config,
      database,
      host,
      username,
      password,
      port,
      protocol,
    }: DatabaseConstructorParams
  ): Promise<Database> {
    return new Promise((resolve, reject) => {
      const DatabaseInstance = new Database(app, {
        config,
        database,
        host,
        username,
        password,
        port,
        protocol,
      });

      DatabaseInstance.#connect()
        .then(() => {
          resolve(DatabaseInstance);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * Authenticate the user to the database.
   */
  #authenticate(username, password) {
    return neo4j.auth.basic(username, password);
  }

  #isLocalhost() {
    const { host } = this.#configurations;

    const hostNames = ["localhost", "127.0.0.1", "[::1]"];

    return hostNames.includes(host);
  }

  /**
   * Set the database configuration for tests.
   */
  #setTestConfiguration() {
    const { host } = this.#configurations;

    if (host !== "localhost" && host !== "127.0.0.1" && host !== "0.0.0.0") {
      consoleMessage({
        message:
          "[OGM] You are trying to run tests on a remote database. This is not recommended.",
        type: "info",
      });
    }

    this.#configurations = {
      ...this.#configurations,
      databaseName: "test",
    };
  }

  /**
   * Verify if the connection to the database is working.
   */
  #verifyConnection = async () => {
    const {
      databaseName: database,
      authentication: { token: auth },
    } = this.#configurations;

    await this.#driver
      .verifyAuthentication({ auth, database })
      .then(() => {
        consoleMessage({
          message: `[OGM] Successfully connected to the database at ${this.connectionString}`,
          type: "success",
        });
      })
      .catch((error) => {
        consoleMessage({
          message: `[OGM] Error connecting to the database\n ${error}`,
          type: "error",
          exit: true,
        });
        process.exit(-1);
      });
  };

  /**
   * Connect to the database server.
   */
  async #connect() {
    const {
      authentication: { token },
      driverParams: config,
    } = this.#configurations;

    await this.#buildConnectionString();

    consoleMessage({
      message: `[OGM] Connecting to the database at ${this.connectionString}`,
      type: "info",
    });

    this.#driver = neo4j.driver(this.connectionString, token, config);

    await this.#verifyConnection();
  }

  /**
   * Resolve DNS to get the IP address
   */
  async #resolveDNS(): Promise<string> {
    const { host } = this.#configurations;

    return new Promise((resolve, reject) => {
      dnsResolver(host, (error, address) => {
        if (error) reject(error);

        resolve(address[0]);
      });
    });
  }

  /**
   * Build the connection string
   */
  async #buildConnectionString(): Promise<void> {
    if (this.#isLocalhost()) return;

    // resolve DNS to get the IP address
    const address = await this.#resolveDNS();

    this.#configurations.host = address;
  }

  /**
   * Close the connection to the database.
   */
  close(): void {
    this.#driver.close();
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
    return this.#driver.session({
      defaultAccessMode: mode,
      database: this.#configurations.databaseName,
    });
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
   * Change the database
   */
  useDatabase(database: string) {
    this.close();

    this.#configurations = {
      ...this.#configurations,
      databaseName: database,
    };

    this.#connect();
  }

  get connectionString(): string {
    const { host, port, protocol, databaseName } = this.#configurations;

    return `${protocol}://${host}:${port}/${databaseName}`;
  }

  get hasConnected(): boolean {
    return this.#driver ? true : false;
  }
}
