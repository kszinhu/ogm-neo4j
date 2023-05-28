import dotenv from "dotenv";
import neo4j, { Driver, Config } from "neo4j-driver";

import { consoleMessage } from "utils";

export default class OGM {
  #driver!: Driver;

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
    username: string,
    password: string,
    config: Config
  ) {
    const auth = neo4j.auth.basic(username, password);

    try {
      consoleMessage({
        message: "[OGM] Connecting to the database...",
        type: "info",
      });

      this.#driver = neo4j.driver(connectionString, auth, config);
    } catch (error) {
      consoleMessage({
        message: "[OGM] Error connecting to the database",
        type: "error",
        exit: true,
      });
    }

    // check if the connection is successful
    this.#driver
      .verifyAuthentication()
      .then(() => {
        consoleMessage({
          message: "[OGM] Successfully connected to the database",
          type: "success",
        });
      })
      .catch((error) => {
        consoleMessage({
          message: "[OGM] Error connecting to the database",
          type: "error",
          exit: true,
        });
        process.exit(-1);
      });
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

  /**
   * Close the connection to the database.
   */
  close(): void {
    this.#driver.close();
  }
}
