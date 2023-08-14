import OGM from "../app/app";
import Model from "./model";

type AnyModel = Model<any, any>;

class ModelMap<M extends Record<string, AnyModel>> {
  #app: OGM;
  #models: Map<keyof M & string, M[keyof M]>;

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
  get<K extends keyof M & string>(name: K): M[keyof M] | undefined {
    return this.#models.get(name as string);
  }

  /**
   * Set the model.
   */
  set<K extends keyof M & string>(name: K, model: AnyModel): void {
    this.#models.set(name, model as M[keyof M]);
  }

  /**
   * Get the keys of the models.
   */
  keys(): IterableIterator<keyof M & string> {
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
  forEach(
    callback: (
      model: M[keyof M],
      name: keyof M,
      map?: Map<keyof M, M[keyof M]>
    ) => void
  ): void {
    this.#models.forEach(callback);
  }

  /**F
   * Clear the models.
   */
  clear(): void {
    this.#models.clear();
  }

  /**
   * Get the schema of the model.
   */
  schema(name: keyof M & string): M[keyof M & string]["schema"] | undefined {
    return this.#models.get(name)?.schema;
  }
}

export default ModelMap;
