import { readFileSync } from "fs";

/**
 * @description
 * The SchemaParser class.
 *
 * @classdesc Responsible for parsing the schema file and generate the schema of the database.
 *
 * @param {string} schemaPath - The path to the schema file.
 *
 * @returns {SchemaParser} - The SchemaParser instance.
 */
class SchemaParser {
  private _schemaFile: string;

  constructor(schemaPath: string) {
    this._schemaFile = readFileSync(schemaPath, "utf-8");
  }

  /**
   * @description
   * Parse the schema file and generate the schema of the database.
   *
   * @returns {string} - The schema of the database.
   *
   * @example
   * const schema = new SchemaParser("./schema.ogm").parse();
   */
  parse(): string {
    return this._schemaFile;
  }
}

export default SchemaParser;
