import OGM from "@app/app";
import Node from "@models/node";
import { queries } from "@query/queries";

export function DetachFrom(app: OGM, from: Node<any>, to: Node<any>) {
  const params = {
    fromId: from.identity,
    toId: to.identity,
  };

  return app.writeCypher(queries.detachFrom, params).then(() => [from, to]);
}
