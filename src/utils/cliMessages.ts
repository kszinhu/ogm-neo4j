interface ICliMessageArgs {
  message: string;
  type: "error" | "success" | "info";
  exit?: boolean;
}

const consoleMessage = ({ message, type, exit = false }: ICliMessageArgs) => {
  const colors = {
      error: "\x1b[31m%s\x1b[0m",
      success: "\x1b[32m%s\x1b[0m",
      info: "\x1b[36m%s\x1b[0m",
      white: "\x1b[37m%s\x1b[0m",
    } as const,
    handleConsoleType = {
      error: console.error,
      success: console.log,
      info: console.info,
    } as const;

  message = colors[type].replace("%s", message);

  handleConsoleType[type](message);

  if (exit) {
    process.exit(-1);
  }
};

export default consoleMessage;
