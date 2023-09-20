import {
  IdentifierPropertySchema,
  ModelIdentifier,
  PropertySchema,
  ProvidedModelSchema,
  ProvidedPropertiesFactory,
} from "../types/models";

import OGM from "@app/app";
import Builder from "@query/builder";
import Model from "@models/model";
import Entity from "@models/entity";
import Create from "@query/services/create";
import FindAll, { SearchOptions } from "@query/services/findAll";
import Formatter from "@query/formatter";
import First from "@query/services/first";

type FormattedResponse<Data extends Record<string, any>> = Map<string, Data>;

class Queryable<
  Schema extends Record<string, any>,
  P extends ProvidedPropertiesFactory<
    keyof Schema & string,
    keyof Schema & string
  >
> {
  #application: OGM;
  protected _formatter: Formatter<Schema>;

  constructor(
    app: OGM,
    schema: ProvidedModelSchema<keyof Schema & string, keyof Schema & string>
  ) {
    this.#application = app;
    this._formatter = new Formatter(
      this as unknown as Model<Schema, P>,
      schema
    );
  }

  /* @internal */
  #isPropertySchema(property: any): property is PropertySchema {
    return (
      Object.hasOwnProperty.call(property, "type") &&
      Object.hasOwnProperty.call(property, "readonly") &&
      Object.hasOwnProperty.call(property, "unique") &&
      Object.hasOwnProperty.call(property, "required") &&
      Object.hasOwnProperty.call(property, "defaultValue")
    );
  }

  /**
   * Query builder
   */
  query() {
    return new Builder(this.#application);
  }

  /**
   * Create a new record of this model.
   */
  async create(data: Schema): Promise<Entity<Schema>> {
    // Queryable is a generic class, so we need to cast this to a Model<K, P>
    return await Create<Schema, P>(
      this.#application,
      this as unknown as Model<Schema, P>,
      data as any
    ).catch((error) => {
      throw error;
    });
  }

  /**
   * Delete a record of this model by it's identifier.
   */
  async delete(identifier: ModelIdentifier<P, Schema>): Promise<boolean> {
    throw new Error("Not implemented");
  }

  /**
   * Delete all records of this model.
   */
  async deleteAll(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  /**
   * Get a collection of all records of this model.
   */
  async all(options: SearchOptions<Schema>): Promise<FormattedResponse<Schema>>;
  async all(
    properties?: (keyof Schema & string)[] | (keyof Schema & string),
    options?: SearchOptions<Schema>
  ): Promise<FormattedResponse<Schema>>;
  async all(
    arg1?:
      | SearchOptions<Schema>
      | (keyof Schema & string)[]
      | (keyof Schema & string),
    arg2?: SearchOptions<Schema>
  ): Promise<FormattedResponse<Schema>> {
    // Queryable is a generic class, so we need to cast this to a Model<K, P>
    if (Array.isArray(arg1) || typeof arg1 === "string") {
      return await FindAll<Schema, P>(
        this.#application,
        this as unknown as Model<Schema, P>,
        typeof arg1 === "string" ? [arg1] : arg1,
        arg2 as SearchOptions<Schema>
      )
        .then((result) => {
          return this._formatter.format(result);
        })
        .catch((error) => {
          throw error;
        });
    } else {
      return await FindAll<Schema, P>(
        this.#application,
        this as unknown as Model<Schema, P>,
        undefined,
        arg1 as SearchOptions<Schema>
      )
        .then((result) => {
          return this._formatter.format(result);
        })
        .catch((error) => {
          throw error;
        });
    }
  }

  /**
   * Find a record of this model by it's identifier.
   */
  async find(
    identifier: ModelIdentifier<P, Schema>
  ): Promise<FormattedResponse<Schema>> {
    return this.first("id", identifier);
  }

  /**
   * Find a record of this model by it's internal ID (neo4j ID).
   */
  async findByID(id: string): Promise<FormattedResponse<Schema>> {
    throw new Error("Not implemented");
  }

  /**
   * Find a record by a property.
   */
  async first(
    key: keyof Schema & string,
    value: Schema[keyof Schema]
  ): Promise<FormattedResponse<Schema>> {
    return First<Schema, P>(
      this.#application,
      this as unknown as Model<Schema, P>,
      key,
      value
    )
      .then((result) => {
        return this._formatter.format(result);
      })
      .catch((error) => {
        throw error;
      });
  }
}

export default Queryable;
