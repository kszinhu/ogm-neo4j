import { readFileSync } from "fs";
import { type } from "os";

interface IToken {
  name: string;
  properties: string[];
}

export type TokenMap = Map<"nodes" | "relationships", IToken[]>;

// TODO: change this
export interface ISchema {
  nodesTypes: IToken[];
  relationshipsTypes: IToken[];
}

/**
 * Responsible for parsing the schema file and generate the schema of the database.
 */
class SchemaParser {
  #schemaFile: string;
  #tokenizedSchema: string;

  /**
   * @param schemaPath The path to the schema file.
   */
  constructor(schemaPath: string) {
    this.#schemaFile = readFileSync(schemaPath, "utf-8");

    this.#tokenizedSchema = this.#tokenizer();
    console.debug(this.#tokenizedSchema);
  }

  #generateSchema(tokens: TokenMap): ISchema {
    return {
      nodesTypes: tokens.get("nodes")!,
      relationshipsTypes: tokens.get("relationships")!,
    };
  }

  /**
   * Add token to a keyword on schema file.
   * @internal
   *
   * @example
   * > Root string:
   * Node User {
   *   id:         String
   *   cpf:        String
   *   email:      String
   *   username:   String
   *   password:   String
   *   name:       String
   *   rg:         String?
   *   sex:        Enum { M, F, X }
   *   birth_at:   Date
   *   address:    Location
   *   tickets:    [Ticket] @relation(name: "bought_by", direction: "in")
   *   created_at: Date
   *   updated_at: Date
   * }
   *
   * ---
   *
   * > Tokenized string
   * Node User {
   *   id:         STRING_REQUIRED
   *   cpf:        STRING_REQUIRED
   *   email:      STRING_REQUIRED
   *   username:   STRING_REQUIRED
   *   password:   STRING_REQUIRED
   *   name:       STRING_REQUIRED
   *   rg:         STRING_OPTIONAL
   *   sex:        ENUM[M, F, X]_REQUIRED
   *   birth_at:   DATE_REQUIRED
   *   address:    Location$RELATION_REQUIRED
   *   tickets:    Ticket$MULTIPLE_RELATION$DIRECTION_IN$NAME_'bought_by'
   *   created_at: DATE_REQUIRED
   *   updated_at: DATE_REQUIRED
   * }
   */
  #tokenizer(): string {
    // split each block by Node or Relationship keyword and empty line
    const splitByBlockRegex = /(?=Node|Relationship)\s+|\n{2,}/g,
      // match each property inside the block, until '\n'
      propertyRegex =
        /(?<property>\w+)\s*:\s*(?<type>\[?\w+\]?)\s*(?<params>(\{.*\})?|\@\w+\((\s*\w+\s*:\s*.+?\s*(?:,|$)\s*)+\))?/ms;

    const tokenizedSchema = this.#schemaFile
      .split(splitByBlockRegex)
      .map((block) => {
        // filter block with '//' comment
        if (block.startsWith("//")) return;
        // use only properties block
        block = block.split("\n").slice(1, -1).join("\n");
        // remove string between '//' and '\n' (without '\n')
        block = block.replace(/\/\/.*\n/g, "");
        // remove string between '/*' and '*/' (with '\n', until the last '*/')
        block = block.replace(/\/\*[\s\S]*?\*\//g, "");

        // TODO: set node or relationship token_name

        // Now we see each line inside the block to tokenize each property
        const properties = block
          .split("\n")
          .map((line) => {
            // console.debug(`[l]: ${line}`);

            const match = propertyRegex.exec(line);

            if (!match) {
              console.debug(`no match: ${line}`);
              return;
            }

            const { property, type, params } = (match.groups ?? {}) as {
              property: string;
              type: string;
              params?: string;
            };

            // console.debug(`\n[p]: ${property} [t]: ${type} [params]: ${params}`);

            const tokenType = this.#setTokenType(type.toUpperCase()),
              requiredOrOptional = this.#setRequiredOrOptional(type),
              multipleOrNot = this.#setMultipleOrNot(type),
              relationParameters = params
                ? this.#setRelationParameters(params)
                : undefined;

            return `${property}: ${tokenType}${
              requiredOrOptional ? "_" + requiredOrOptional : ""
            }${multipleOrNot ? "_" + multipleOrNot : ""}${
              relationParameters ? "$" + relationParameters.join("$") : ""
            }`;
          })
          .filter((property) => property !== undefined);

        console.debug(properties);
      });

    return tokenizedSchema.join("\n");
  }

  /**
   * Set relation parameters on token.
   * @internal
   *
   * @example
   * setRelationParameters("name: 'bought_by', direction: 'in'") // -> ["NAME_'bought_by'","DIRECTION_IN"]
   */
  #setRelationParameters(relationParameters: string): string[] {
    const handleByTypeParameters = {
      name: (value: string) => `NAME_'${value}'`,
      direction: (value: string) => `DIRECTION_${value.toUpperCase()}`,
    };

    let match: RegExpExecArray | null;
    const parametersRegex = /(?<type>\w+):\s*(?<value>\w+)/g,
      parameters: string[] = [];

    while ((match = parametersRegex.exec(relationParameters)) !== null) {
      const { type, value } = match.groups as { type: string; value: string };

      if (handleByTypeParameters[type])
        parameters.push(handleByTypeParameters[type](value));
    }

    return parameters;
  }

  /**
   * Set if the token is required or optional.
   * @internal
   *
   * @example
   * setRequiredOrOptional("String?") // -> "OPTIONAL"
   */
  #setRequiredOrOptional(requiredOrOptional: string): string {
    return requiredOrOptional.endsWith("?") ? "OPTIONAL" : "REQUIRED";
  }

  /**
   * Set if token is multiple or not.
   * @internal
   *
   * @example
   * setMultipleOrNot("LOCATION") // -> "SINGLE"
   * setMultipleOrNot("[LOCATION]") // -> "MULTIPLE"
   */
  #setMultipleOrNot(multipleOrNot: string): string | false {
    return multipleOrNot.startsWith("[") && multipleOrNot.endsWith("]")
      ? "MULTIPLE"
      : false;
  }

  /**
   * Set the token type.
   * @internal
   *
   * @example
   * setType("STRING") // -> "STRING"
   * setType("ENUM { M, F, X }") // -> "ENUM[M, F, X]"
   * setType("DATE") // -> "DATE"
   * setType("LOCATION") // -> "LOCATION"
   * setType("[LOCATION]") // -> "LOCATION"
   */
  #setTokenType(type: string, values?: string): string {
    if (type.startsWith("[")) type = type.slice(1, -1);

    switch (type) {
      case "ENUM": {
        if (values) return `${type}[${values}]`;
        else return type;
      }
      default: {
        return type;
      }
    }
  }

  /**
   * Get the parsed schema.
   * @internal
   */
  get schema(): string {
    // TODO: change this
    return this.#tokenizedSchema;
  }

  /**
   * Parse the schema file and generate the schema of the database.
   * @internal
   */
  // parse(): TokenMap {
  //   const tokenMap: Map<"nodes" | "relationships", IToken[]> = new Map();

  //   let match: RegExpExecArray | null;
  //   while ((match = regex.exec(this.#schemaFile)) !== null) {
  //     const { type, name, properties } = match.groups as {
  //         type: "Node" | "Relationship";
  //         name: string;
  //         properties: string;
  //       },
  //       newNode = { name, properties: properties.split(/\s+/) };

  //     const handleByType = {
  //       Node: () => {
  //         tokenMap.set(
  //           "nodes",
  //           tokenMap.get("nodes")?.concat(newNode) ?? [newNode]
  //         );
  //       },
  //       Relationship: () => {
  //         tokenMap.set(
  //           "relationships",
  //           tokenMap.get("relationships")?.concat(newNode) ?? [newNode]
  //         );
  //       },
  //     };

  //     handleByType[type]();
  //   }

  //   console.debug(tokenMap.values());

  //   return tokenMap;
  // }
}

export default SchemaParser;
