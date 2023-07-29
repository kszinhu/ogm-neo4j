import neo4j, { temporal, spatial, isInt } from "neo4j-driver";

const isTemporal = (
  value: any
): value is (typeof temporal)[keyof typeof temporal] =>
  Object.values(temporal).reduce(
    (acc, checkFunction) => acc || checkFunction(value),
    false
  );

function valueToJson(value) {
  if (isInt(value)) {
    return value.toNumber();
  } else if (isTemporal(value)) {
    return value.toString();
  } else if (spatial.isPoint(value)) {
    switch (value.srid.toString()) {
      // SRID values: @https://neo4j.com/docs/developer-manual/current/cypher/functions/spatial/
      case "4326": // WGS 84 2D
        return { longitude: value.x, latitude: value.y };

      case "4979": // WGS 84 3D
        return { longitude: value.x, latitude: value.y, height: value.z };

      case "7203": // Cartesian 2D
        return { x: value.x, y: value.y };

      case "9157": // Cartesian 3D
        return { x: value.x, y: value.y, z: value.z };
    }
  }

  return value;
}

export default valueToJson;
