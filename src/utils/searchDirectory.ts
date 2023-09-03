import { readdirSync, statSync } from "fs";

const searchSchema = (directoryPath: string): string | undefined => {
  let files = readdirSync(directoryPath);

  files = files.filter((file) => !file.startsWith("."));

  for (const file of files) {
    const fullPath = `${directoryPath}/${file}`;

    if (statSync(fullPath).isDirectory()) {
      const found = searchSchema(fullPath);

      if (found) {
        return found;
      } else {
        continue;
      }
    } else if (file === "schema.ogm") {
      return fullPath;
    }

    continue;
  }
};

/**
 * Searches on entire directory tree for a file named `schema.ogm`
 */
const searchOnDirectory = (directoryPath: string): string => {
  const found = searchSchema(directoryPath);

  if (found) {
    return found;
  } else {
    throw new Error("Schema file not found");
  }
};

export default searchOnDirectory;
