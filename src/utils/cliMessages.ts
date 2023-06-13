interface ICliMessageArgs {
  message: string;
  type?: "error" | "success" | "info" | "normal";
  exit?: boolean;
  error?: string;
}

const consoleMessage = ({
  message,
  type = "normal",
  exit = false,
  error,
}: ICliMessageArgs) => {
  const colors = {
      error: "\x1b[31m%s\x1b[0m",
      success: "\x1b[32m%s\x1b[0m",
      info: "\x1b[36m%s\x1b[0m",
      normal: "\x1b[37m%s\x1b[0m",
    } as const,
    handleConsoleType = {
      error: console.error,
      success: console.log,
      info: console.info,
      normal: console.log,
    } as const;

  message = colors[type].replace("%s", message);

  handleConsoleType[type](message);

  if (exit) {
    if (error) console.error("\n" + error);
    process.exit(-1);
  }
};

export default consoleMessage;
