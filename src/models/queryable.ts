import OGM from "../app/index";
import Builder from "../query/builder";

class Queryable<P extends Record<string, any>> {
  #application: OGM;

  constructor(app: OGM) {
    this.#application = app;
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
  create() {
    throw new Error("Not implemented");
  }

  /**
   * Delete all records of this model.
   */
  deleteAll() {
    throw new Error("Not implemented");
  }

  /**
   * Get a collection of all records of this model.
   */
  all(properties, order, limit, skip) {
    throw new Error("Not implemented");
  }

  /**
   * Find a record of this model by it's identifier.
   */
  find(identifier) {
    throw new Error("Not implemented");
  }

  /**
   * Find a record of this model by it's internal ID (neo4j ID).
   */
  findByID(id) {
    throw new Error("Not implemented");
  }

  /**
   * Find a record by a property.
   */
  first(key: keyof P, value: P[keyof P]) {
    throw new Error("Not implemented");
  }
}

export default Queryable;
