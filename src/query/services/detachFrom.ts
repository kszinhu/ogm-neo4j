import OGM from "@app/app.js";
import Node from "@models/node.js";
import { queries } from "@query/queries.js";

export function DetachFrom(app: OGM, from: Node<any>, to: Node<any>) {
  const params = {
    fromId: from.identity,
    toId: to.identity,
  };

  return app.writeCypher(queries.detachFrom, params).then(() => [from, to]);
}
