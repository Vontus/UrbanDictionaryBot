import Debug from "debug";

const log = Debug("udbot");
const debug = log.extend("debug");
const warn = log.extend("warn");
const error = log.extend("error");
const info = log.extend("info");

export default {
  log,
  debug,
  warn,
  error,
  info,
};
