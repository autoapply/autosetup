// @flow

const path = require("path");

const winston = require("winston");
const spawn = require("child-process-promise").spawn;
const fse = require("fs-extra");
const ejs = require("ejs");

import type { Context } from "./setup";

const templatesPath = path.resolve(__dirname, "../templates");

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: Object.keys(winston.config.npm.levels)
    })
  ]
});

async function template(name: string, context: Context, args: any = {}) {
  const content = await fse.readFile(path.resolve(templatesPath, name), "utf8");
  function proxy(obj) {
    const handler = {};
    handler.get = (target, name) => {
      if (name in target) {
        const value = target[name];
        if (value !== null) {
          if (typeof value === "object") {
            return new Proxy(value, handler);
          } else if (typeof value !== "undefined") {
            return value;
          }
        }
      }
      throw new Error("Undefined value: " + name);
    };
    return new Proxy(obj, handler);
  }
  return ejs.render(content, Object.assign({ ctx: proxy(context) }, args));
}

async function run(cmd: string, args: Array<string>) {
  const cmdStr = [cmd, ...args].join(" ");
  logger.debug("Executing command: %s", cmdStr);
  const options = { capture: ["stdout", "stderr"] };
  const result = await spawn(cmd, args, options).then(
    result => result,
    e => {
      logger.debug("Error executing command: %s", cmdStr);
      logger.debug("stdout: %s", (e.stdout || "").trimRight());
      logger.debug("stderr: %s", (e.stderr || "").trimRight());
      throw e;
    }
  );
  return result.stdout;
}

module.exports = { logger, template, run };
