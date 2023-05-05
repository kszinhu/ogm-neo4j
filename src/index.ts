import dotenv from "dotenv";
import neo4j, { Driver } from "neo4j-driver";

import searchDirectory from "utils/searchDirectory.js";
import SchemaParser from "parser/schema.js";

export default class OGM {
  private _driver: Driver;
  private database: string;

  /**
   * @description
   * The constructor of the OGM class.
   *
   * @param {string} connectionString - The connection string to the database.
   * @param {string} database - The database name.
   * @param {string} username - The username to the database.
   * @param {string} password - The password to the database.
   * @param {string} config - The configuration object.
   *
   * @returns {OGM} - The OGM instance.
   */
  constructor(
    connectionString: string,
    database: string,
    username: string,
    password: string,
    config: object
  ) {
    const auth = neo4j.auth.basic(username, password);

    this._driver = neo4j.driver(connectionString, auth, config);
    // Import all the models, schemas

    this.database = database;

    // Generate the schema
    const schema = this.getSchemaFile();
    console.log(schema);
  }

  /**
   * @description
   * Generate instance using .env file configuration
   *
   * @returns {OGM} - The OGM instance.
   */
  static fromEnv(): OGM {
    dotenv.config();

    const connectionString =
        process.env.NEO4J_CONNECTION_STRING ??
        `${process.env.NEO4J_PROTOCOL}://${process.env.NEO4J_HOST}:${process.env.NEO4J_PORT}`,
      username = process.env.NEO4J_USERNAME,
      password = process.env.NEO4J_PASSWORD,
      database = process.env.NEO4J_DATABASE ?? "neo4j";

    if (!username || !password) {
      throw new Error("Username or password is missing");
    }

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

    return new OGM(connectionString, database, username, password, config);
  }

  private getSchemaFile(): string {
    const schemaPath = searchDirectory(process.cwd());

    if (!schemaPath) {
      throw new Error("Schema file not found");
    }

    return new SchemaParser(schemaPath).parse();
  }

  /**
   * @description
   * Close the connection to the database.
   *
   */
  close(): void {
    this._driver.close();
  }
}
