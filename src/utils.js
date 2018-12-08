// @flow

const path = require("path");
const childProcess = require("child_process");

const fse = require("fs-extra");
const ejs = require("ejs");

import type { Context } from "./setup";

const templatesPath = path.resolve(__dirname, "../templates");

const logger = {
  level: "info",
  debug: msg => {
    if (logger.level === "debug") {
      // eslint-disable-next-line no-console
      console.error("debug:", msg);
    }
  },
  // eslint-disable-next-line no-console
  info: msg => console.error("info:", msg)
};

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

function run(cmd: string, args: Array<string>) {
  const cmdStr = [cmd, ...args].join(" ");
  logger.debug(`Executing command: ${cmdStr}`);
  return new Promise((resolve, reject) => {
    const result = {
      stdout: Buffer.alloc(0),
      stderr: Buffer.alloc(0)
    };
    const process = childProcess.spawn(cmd, args);
    process.stdout.on("data", data => {
      result.stdout += data;
    });
    process.stderr.on("data", data => {
      result.stderr += data;
    });
    process.on("error", reject);
    process.on("close", code => {
      const stdout = result.stdout.toString("utf8").trim();
      if (code === 0) {
        resolve(stdout);
      } else {
        const stderr = result.stderr.toString().trim();
        logger.debug(`Error executing command: ${cmdStr}`);
        logger.debug(`stdout: ${stdout}`);
        logger.debug(`stderr: ${stderr}`);
        reject(new Error(`Command failed: ${cmdStr}`));
      }
    });
  });
}

module.exports = { logger, template, run };
