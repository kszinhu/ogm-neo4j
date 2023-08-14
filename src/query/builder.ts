import OGM from "@app/app";
import Model from "@models/model";
import Property from "@models/property";

import Statement, { PropertyRelation } from "./statement";

import Match from "./sections/match";
import Order from "./sections/order";
import Where from "./sections/where";
import WithStatement, { type WithParams } from "./statements/with";
import WhereStatement from "./statements/where";
import RawStatement from "./statements/raw";

import type { PropertySchema } from "src/types/models";
import WhereId from "./sections/whereId";
import WhereBetween from "./sections/whereBetween";

type SetPropertyMap = Map<string, { operator?: string; value: any }>;

class Builder {
  #app: OGM;
  #params: Record<string, any>;
  #statements: (Statement | WithStatement)[];
  #currentStatement?: Statement;
  #where: WhereStatement | null = null;

  constructor(app: OGM) {
    this.#app = app;

    this.#params = {};
    this.#statements = [];
  }

  /**
   * Build the query and return the query string and parameters
   */
  build(): { query: string; params: Record<string, any> } {
    const query = this.#query();

    return { query, params: this.#params };
  }

  create(
    alias: string,
    model: Model<any, any> | string,
    properties?: Map<string, PropertySchema>
  ): Builder {
    this.whereStatement("WHERE");
    this.statement("CREATE");

    this.#currentStatement?.match(
      new Match(alias, model, this.#convertPropertyMap(alias, properties))
    );

    return this;
  }

  detachDelete(...variables: string[]): Builder {
    this.#currentStatement?.detachDelete(...variables);

    return this;
  }

  delete(...fields: string[]): Builder {
    this.#currentStatement?.delete(...fields);

    return this;
  }

  /**
   * Execute the query
   */
  async execute(mode: "WRITE" | "READ" = "WRITE") {
    const { query, params } = this.build();

    switch (mode) {
      case "READ":
        const readSession = this.#app.readSession();

        await readSession
          .executeRead((transaction) => transaction.run(query, params))
          .then((response) => {
            readSession.close();
            return response;
          });

      case "WRITE":
        const writeSession = this.#app.writeSession();

        await writeSession
          .executeWrite((transaction) => transaction.run(query, params))
          .then((response) => {
            writeSession.close();
            return response;
          });
    }
  }

  set(properties: SetPropertyMap): Builder {
    properties.forEach(({ value, operator = "=" }, key) => {
      this.#currentStatement?.set(key, value, operator);
    });

    return this;
  }

  limit(limit: number): Builder {
    this.#currentStatement?.limit(limit);

    return this;
  }

  match(
    alias: string,
    model: Model<any, any> | string,
    properties?: Map<string, PropertySchema>
  ): Builder {
    this.whereStatement("WHERE");
    this.statement();

    this.#currentStatement?.match(
      new Match(alias, model, this.#convertPropertyMap(alias, properties))
    );

    return this;
  }

  onCreateSet(properties: SetPropertyMap): Builder {
    properties.forEach(({ value, operator = "=" }, key) => {
      this.#currentStatement?.onCreateSet(key, value, operator);
    });

    return this;
  }

  onMatchSet(properties: SetPropertyMap): Builder {
    properties.forEach(({ value, operator = "=" }, key) => {
      this.#currentStatement?.onMatchSet(key, value, operator);
    });

    return this;
  }

  or(...args: string[]) {
    this.whereStatement("OR");

    return this.where(...args);
  }

  orderBy(orderBy: string, direction: "ASC" | "DESC" = "ASC"): Builder {
    this.#currentStatement?.order(new Order(orderBy, direction));

    return this;
  }

  /**
   * Build the pattern (query without keywords)
   */
  pattern() {
    this.whereStatement();
    this.statement();

    return this.#statements
      .map((statement) => statement.toString(false))
      .join("\n");
  }

  remove(...variables: string[]): Builder {
    this.#currentStatement?.remove(variables);

    return this;
  }

  return(...args: string[]): Builder {
    this.#currentStatement?.return(...args);

    return this;
  }

  relationship(relationship: PropertyRelation, alias: string): Builder {
    this.#currentStatement?.relationship(relationship, alias);

    return this;
  }

  statement(prefix?: string): Builder {
    if (this.#currentStatement) this.#statements.push(this.#currentStatement);

    this.#currentStatement = new Statement(prefix);

    return this;
  }

  skip(skip: number): Builder {
    this.#currentStatement?.skip(skip);

    return this;
  }

  to(
    alias: string,
    model: Model<any, any>,
    properties: Map<string, PropertySchema>
  ): Builder {
    this.#currentStatement?.match(
      new Match(alias, model, this.#convertPropertyMap(alias, properties))
    );

    return this;
  }

  /**
   * Complete the relationship statement to point to anything
   */
  toAny(): Builder {
    this.#currentStatement?.match(new Match());

    return this;
  }

  whereStatement(prefix?: string): Builder {
    if (this.#where) this.#currentStatement?.where(this.#where);

    this.#where = new WhereStatement(prefix);

    return this;
  }

  with(statement: WithParams) {
    this.whereStatement("WHERE");
    this.statement();

    this.#statements.push(new WithStatement(statement));

    return this;
  }

  where(...args: string[]) {
    if (!args.length) return this;

    if (args.length == 2) {
      args = [args[0], "=", args[1]];
    } else if (args.length == 1) {
      // single string
      this.#where?.append(new RawStatement(args[0]));
    } else {
      const [key, operator, value] = args;
      const right = this.#addWhereParameter(key, value);

      this.#params[right] = value;
      if (!Where.isWhereOperator(operator)) {
        throw new Error(`Invalid operator: ${operator}`);
      }

      this.#where?.append(new Where(key, operator, `$${right}`));
    }
  }

  whereId(alias: string, id: string): Builder {
    const param = this.#addWhereParameter(`${alias}_id`, id);

    this.#where?.append(new WhereId(alias, param));

    return this;
  }

  /**
   * Adds a raw where clause
   */
  whereRaw(condition: string): Builder {
    this.#where?.append(new RawStatement(condition));

    return this;
  }

  whereNot(...args: string[]) {
    this.where(...args);

    const lastWhereStatement = this.#where?.last();

    if (lastWhereStatement instanceof Where) {
      lastWhereStatement.setNegative(true);
    }

    return this;
  }

  whereBetween(alias: string, floor: string | number, ceil: string | number) {
    const floorParam = this.#addWhereParameter(`${alias}_floor`, floor);
    const ceilParam = this.#addWhereParameter(`${alias}_ceil`, ceil);

    this.#where?.append(new WhereBetween(alias, floorParam, ceilParam));

    return this;
  }

  whereNotBetween(alias, floor, ceil) {
    this.whereBetween(alias, floor, ceil);

    const lastWhereStatement = this.#where?.last();

    if (lastWhereStatement instanceof WhereBetween) {
      lastWhereStatement.setNegative(true);
    }

    return this;
  }

  /**
   * @internal
   *
   * Build the query string
   */
  #query() {
    this.whereStatement();
    this.statement();

    return this.#statements.map((statement) => statement.toString()).join("\n");
  }

  #convertPropertyMap(alias: string, properties?: Map<string, PropertySchema>) {
    if (!properties?.size) return [];

    Object.entries(properties).forEach(
      ([key, value]: [string, PropertySchema]) => {
        const propertyAlias = `${alias}_${key}`;

        this.#params[propertyAlias] = value;

        return new Property(key, value);
      }
    );
  }

  #addWhereParameter(key, value) {
    const base = `where_${key.replace(/[^a-z0-9]+/g, "_")}`;
    let attempt = 1;

    let variable = base;

    while (typeof this.#params[variable] != "undefined") {
      attempt++;

      variable = `${base}_${attempt}`;
    }

    this.#params[variable] = value;

    return variable;
  }
}

export default Builder;
