import { Model } from "@models/index";
import Property from "@models/property";
import OGM from "@app/app";
import { QueryBuilder } from "@query/index";
import { castValues } from "./toCypher";
import { PropertySchema } from "../../../types/models";
import { PropertyType } from "../../../types/lexer";

interface splitPropertiesReturn {
  inlineProperties: Map<string, PropertySchema>;
  setProperties: Map<string, PropertySchema>;
  onCreateProperties: Map<string, PropertySchema>;
  onMatchProperties: Map<string, PropertySchema>;
}

function splitProperties<M extends Model<any, any>>(
  model: M,
  properties: Record<keyof M["properties"], any>
): splitPropertiesReturn {
  const inlineProperties: Map<string, PropertySchema> = new Map(),
    setProperties: Map<string, PropertySchema> = new Map(),
    onCreateProperties: Map<string, PropertySchema> = new Map();

  model.properties.forEach((property, _key) => {
    const { name } = property;

    if (!name || !properties.has(name)) return;

    const value = castValues(property, properties.get(name));

    inlineProperties.set(name, value);

    if (property.required) {
      onCreateProperties.set(name, value);
    } else if (property.readonly) {
      setProperties.set(name, value);
    }
  });

  return {
    inlineProperties,
    setProperties,
    onCreateProperties,
    onMatchProperties: new Map(),
  };
}

export function addNodeToStatement<M extends Model<any, any>>(
  app: OGM,
  builder: QueryBuilder,
  model: M,
  properties: Record<keyof M["properties"], any>,
  alias: string,
  aliases: string[] = []
) {
  const {
    inlineProperties,
    setProperties,
    onCreateProperties: onCreate,
    onMatchProperties: onMatch,
  } = splitProperties(model, properties);

  if (!aliases.includes(alias)) {
    aliases.push(alias);
  }

  builder.create(alias, model, inlineProperties);

  if (onCreate.size) {
    const SetPropertyMap = new Map();

    onCreate.forEach((value, key) => {
      SetPropertyMap.set(key, { value });
    });

    builder.onCreateSet(SetPropertyMap);
  }

  if (onMatch.size) {
    const SetPropertyMap = new Map();

    onMatch.forEach((value, key) => {
      SetPropertyMap.set(key, { value });
    });

    builder.onMatchSet(SetPropertyMap);
  }

  if (setProperties.size) {
    const SetPropertyMap = new Map();

    setProperties.forEach((value, key) => {
      SetPropertyMap.set(key, { value });
    });

    builder.set(SetPropertyMap);
  }

  model.relationships.forEach((relationship, key, relationships) => {
    if (!model.properties.has(key)) {
      return;
    }

    const relation_alias = `${alias}_${key}_relation`,
      target_alias = `${alias}_${key}_node`;

    builder.with({ withs: aliases });

    if (!relationship.target) {
      throw new Error(`A target model is required for ${key} in ${model.name}`);
    } else if (Array.isArray(relationship.target)) {
      throw new Error(
        `Cannot create a relationship to multiple models for ${key} in ${model.name}`
      );
    }

    const target = app.models.get(relationship.target);

    if (!target) {
      throw new Error(
        `Cannot create a relationship to an unknown model ${relationship.target}`
      );
    }

    const relations = {
      multiple() {
        const index = properties.keys().indexOf(key);

        addRelationshipToStatement(
          app,
          builder,
          alias,
          relation_alias + index,
          target_alias + index,
          relationship,
          properties.get(key),
          aliases
        );
      },
      single() {
        addRelationshipToStatement(
          app,
          builder,
          alias,
          relation_alias,
          target_alias,
          relationship,
          properties.get(key),
          aliases
        );
      },
    };

    relations[relationship.multiple ? "multiple" : "single"]();
  });
}

export function addRelationshipToStatement<M extends Model<any, any>>(
  app: OGM,
  builder: QueryBuilder,
  alias: string,
  relationAlias: string,
  targetAlias: string,
  relationship: Property<PropertyType.relation>,
  value: any,
  aliases: string[] = []
) {
  const { direction, properties, target } = relationship;

  if (!target || !properties || Array.isArray(target)) {
    throw new Error(
      `Cannot create a relationship without a target model and properties`
    );
  }

  if (!aliases.includes(alias)) {
    aliases.push(alias);
  }

  if (!aliases.includes(targetAlias)) {
    aliases.push(targetAlias);
  }

  const targetModel = app.models.get(target);

  if (!targetModel) {
    throw new Error(
      `Cannot create a relationship to an unknown model ${target}`
    );
  }

  builder.create(
    relationAlias,
    targetModel,
    new Map(Object.entries(properties))
  );

  builder.match(targetAlias, targetModel, new Map([["id", value]]));

  builder.with({ withs: aliases });

  if (direction === "in") {
    builder.create(alias, targetModel, new Map([["id", value]]));
  } else {
    builder.create(targetAlias, targetModel, new Map([["id", value]]));
  }
}
