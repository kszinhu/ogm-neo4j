import {
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
    this._formatter = new Formatter(schema);
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
  async delete<M extends Model<Schema, P>>(
    identifier: ModelIdentifier<M>
  ): Promise<boolean> {
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
  async all(
    options: SearchOptions<Schema>
  ): Promise<Map<string, Record<string, any>>>;
  async all(
    properties?: (keyof Schema & string)[] | (keyof Schema & string),
    options?: SearchOptions<Schema>
  ): Promise<Map<string, Record<string, any>>>;
  async all(
    arg1?:
      | SearchOptions<Schema>
      | (keyof Schema & string)[]
      | (keyof Schema & string),
    arg2?: SearchOptions<Schema>
  ): Promise<Map<string, Record<string, any>>> {
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
  async find<M extends Model<Schema, P>>(
    identifier: ModelIdentifier<M>
  ): Promise<M | undefined> {
    throw new Error("Not implemented");
  }

  /**
   * Find a record of this model by it's internal ID (neo4j ID).
   */
  async findByID<M extends Model<Schema, P>>(
    id: string
  ): Promise<M | undefined> {
    throw new Error("Not implemented");
  }

  /**
   * Find a record by a property.
   */
  async first<M extends Model<Schema, P>>(
    key: keyof P,
    value: P[keyof P]
  ): Promise<M | undefined> {
    throw new Error("Not implemented");
  }
}

export default Queryable;
