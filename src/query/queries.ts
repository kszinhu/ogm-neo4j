export const queries = {
  createNode: `
    CREATE (node{{labels}} $properties)
    
    RETURN node
  `,
  detachFrom: `
    MATCH (from)-[relation]->(to)
    WHERE id(from) = $fromId AND id(to) = $toId
    DELETE relation
  `,
  deleteRelationship: `
    MATCH ()-[relation]->()
    WHERE id(relation) = $identity
    DELETE relation
  `,
  relateTo: `
    MATCH (from), (to)
    WHERE id(from) = $fromId
    AND id(to) = $toId
    {{mode}} (from){{direction_in}}-[relation:{{type}}]-{{direction_out}}(to)
    {{set}}
    
    RETURN relation
  `,
  updateNode: `
    MATCH (node)
    WHERE id(node) = $identity
    SET node += $properties
    WITH node

    UNWIND keys($properties) AS key
    
    RETURN key, node[key] AS value
  `,
  updateRelationship: `
    MATCH ()-[relation]->()
    WHERE id(relation) = $identity
    SET relation += $properties
    
    RETURN properties(relation) AS properties
  `,
} as const;
