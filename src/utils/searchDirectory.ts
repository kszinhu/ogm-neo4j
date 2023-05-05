import { readdirSync, statSync } from "fs";

const searchDirectory = (directoryPath: string): string | undefined => {
  const files = readdirSync(directoryPath);

  for (const file of files) {
    const fullPath = `${directoryPath}/${file}`;

    if (statSync(fullPath).isDirectory()) {
      const found = searchDirectory(fullPath);
      if (found) {
        return found;
      }
    } else if (file === "schema.ogm") {
      return fullPath;
    }
  }

  return undefined;
};

export default searchDirectory;
