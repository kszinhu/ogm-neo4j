import OGM from "../app/index";
import Model from "./model";

class ModelMap {
  #app: OGM;
  #models: Map<string, Model<any>>;

  constructor(app: OGM) {
    this.#app = app;
    this.#models = new Map();
  }

  /**
   * Check if the model exists.
   */
  has(name: string): boolean {
    return this.#models.has(name);
  }

  /**
   * Get the model by identifier.
   */
  get(name: string): Model<any> | undefined {
    return this.#models.get(name);
  }

  /**
   * Set the model.
   */
  set(name: string, model: Model<any>): void {
    this.#models.set(name, model);
  }

  /**
   * Get the keys of the models.
   */
  keys(): IterableIterator<string> {
    return this.#models.keys();
  }

  /**
   * Delete the model.
   */
  delete(name: string): boolean {
    return this.#models.delete(name);
  }

  /**
   * Iterate over the models.
   */
  forEach(callback: (model: Model<any>, name: string) => void): void {
    this.#models.forEach(callback);
  }

  /**
   * Clear the models.
   */
  clear(): void {
    this.#models.clear();
  }

  /**
   * Get the schema of the model.
   */
  schema(name: string): any {
    return this.#models.get(name)?.schema;
  }
}

export default ModelMap;
