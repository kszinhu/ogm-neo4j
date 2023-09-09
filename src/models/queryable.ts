import {
  ModelIdentifier,
  PropertySchema,
  ProvidedPropertiesFactory,
} from "../types/models";

import OGM from "@app/app";
import Builder from "@query/builder";
import Model from "@models/model";
import Create from "@query/services/create";

class Queryable<K extends string, P extends ProvidedPropertiesFactory<K, K>> {
  #application: OGM;

  constructor(app: OGM) {
    this.#application = app;
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
  async create(data: P): Promise<void> {
    // Queryable is a generic class, so we need to cast this to a Model<K, P>
    Create(this.#application, this as unknown as Model<K, P>, data as any);
  }

  /**
   * Delete a record of this model by it's identifier.
   */
  async delete<M extends Model<K, P>>(
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
  async all<M extends Model<K, P>>(
    properties?: K[],
    options?: {
      limit?: number;
      skip?: number;
      order?: "ASC" | "DESC";
    }
  ): Promise<M[]> {
    throw new Error("Not implemented");
  }

  /**
   * Find a record of this model by it's identifier.
   */
  async find<M extends Model<K, P>>(
    identifier: ModelIdentifier<M>
  ): Promise<M | undefined> {
    throw new Error("Not implemented");
  }

  /**
   * Find a record of this model by it's internal ID (neo4j ID).
   */
  async findByID<M extends Model<K, P>>(id: string): Promise<M | undefined> {
    throw new Error("Not implemented");
  }

  /**
   * Find a record by a property.
   */
  async first<M extends Model<K, P>>(
    key: keyof P,
    value: P[keyof P]
  ): Promise<M | undefined> {
    throw new Error("Not implemented");
  }
}

export default Queryable;
