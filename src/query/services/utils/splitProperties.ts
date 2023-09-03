import { Model } from "@models/index";
import { castValues } from "./toCypher";
import OGM from "@app/app";
import { QueryBuilder } from "@query/index";
import { PropertySchema } from "../../../types/models";
import { WithParams } from "@query/statements/with";

interface splitPropertiesReturn {
  inlineProperties: Map<string, PropertySchema>;
  setProperties: Map<string, PropertySchema>;
  onCreateProperties: Map<string, PropertySchema>;
  onMatchProperties: Map<string, PropertySchema>;
}

function splitProperties<M extends Model<any, any>>(
  model: M
): splitPropertiesReturn {
  const inlineProperties: Map<string, PropertySchema> = new Map(),
    setProperties: Map<string, PropertySchema> = new Map(),
    onCreateProperties: Map<string, PropertySchema> = new Map();

  model.properties.forEach((property, _key, properties) => {
    const { name } = property;

    if (!name || !properties.has(name)) {
      return;
    }

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
  alias: string,
  aliases: string[] = []
) {
  const {
    inlineProperties,
    setProperties,
    onCreateProperties: onCreate,
    onMatchProperties: onMatch,
  } = splitProperties(model);

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

  model.relationships.forEach((relationship, key) => {
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

    const {
      inlineProperties: inlineProperties,
      setProperties: setProperties,
      onCreateProperties: onCreate,
      onMatchProperties: onMatch,
    } = splitProperties(target);

    builder.create(target_alias, target, inlineProperties);

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
  });
}
