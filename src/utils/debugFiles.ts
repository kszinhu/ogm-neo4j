import { existsSync, openSync, mkdirSync, writeSync } from "fs";

function createIfNotExists(path: string, fileName: string, content: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
  writeSync(openSync(`${path}/${fileName}`, "w"), content);
}

export { createIfNotExists };
