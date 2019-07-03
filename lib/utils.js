const { stdin } = require("process");
const { resolve } = require("path");
const { spawn } = require("child_process");

const { readFile } = require("fs-extra");
const { safeLoad } = require("js-yaml");
const { render } = require("ejs");

const templatesPath = resolve(__dirname, "./resources");

const logger = {
  level: "info",
  debug: msg => {
    if (logger.level === "debug") {
      // eslint-disable-next-line no-console
      console.error("debug:", msg);
    }
  },
  // eslint-disable-next-line no-console
  info: msg => console.error("info:", msg),
  // eslint-disable-next-line no-console
  warn: msg => console.error("warn:", msg)
};

async function readYaml(path) {
  let content;
  if (path === "-") {
    content = await readStdin();
    if (!content.length) {
      logger.warn("Reading from stdin, but input was empty!");
    }
  } else {
    content = await readFile(path, "utf8");
  }
  const result = safeLoad(content);
  return result == null ? {} : result;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const data = [];
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", d => data.push(d));
    stdin.on("error", err => reject(err));
    stdin.on("end", () => resolve(data.join("")));
  });
}

async function template(name, context, args = {}) {
  const content = await readFile(resolve(templatesPath, name), "utf8");
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
  return render(content, Object.assign({ ctx: proxy(context) }, args));
}

function getHostname(url) {
  const m = url.match(/^(?:[^@]+@)?([^@:]+).*/);
  return m ? m[1] : null;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const cmdStr = [cmd, ...args].join(" ");
    logger.debug(`Executing command: ${cmdStr}`);
    const result = {
      stdout: Buffer.alloc(0),
      stderr: Buffer.alloc(0)
    };
    const process = spawn(cmd, args);
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

function joinYaml(documents) {
  let str = "";
  for (const doc of documents) {
    if (str) {
      if (!str.endsWith("---") && !str.endsWith("---\n")) {
        str += "\n---";
      }
      if (!str.endsWith("\n")) {
        str += "\n";
      }
    }
    str += doc.trim();
  }
  if (str.endsWith("---")) {
    str = str.substr(0, str.length - 3).trimRight();
  }
  return str;
}

module.exports = {
  logger,
  readYaml,
  readStdin,
  template,
  getHostname,
  run,
  joinYaml
};
