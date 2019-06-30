const { resolve } = require("path");

const { readJson } = require("fs-extra");
const Ajv = require("ajv");

const { readYaml } = require("./utils");

const schemaPath = resolve(__dirname, "../config-schema.json");

async function readConfig(path = null) {
  const config = path ? await readYaml(path) : {};
  await validateConfig(config);
  return config;
}

async function validateConfig(config) {
  const schema = await readJson(schemaPath);
  var ajv = new Ajv({ useDefaults: true });
  var valid = ajv.validate(schema, config);
  return valid ? [] : ajv.errors;
}

async function checkConfig(config) {
  const errors = await validateConfig(config);
  if (!config.git || !config.git.url) {
    errors.push({ message: "Missing repository URL: git.url" });
  }
  if (config.secrets.dockercfg && config.secrets.docker.length > 0) {
    errors.push({
      message: "Either set secrets.docker or secrets.dockercfg, not both!"
    });
  }
  if (config.kubernetes.kustomize && config.kubernetes.recursive) {
    errors.push({
      message: "Cannot combine kubernetes.recursive and kubernetes.kustomize!"
    });
  }
  if (config.kubernetes.kustomize && config.kubernetes.paths.length > 1) {
    errors.push({
      message:
        "Array kubernetes.paths may only have 1 entry when kustomize is true!"
    });
  }
  if (errors.length > 0) {
    throw new ConfigError(errors);
  }
}

class ConfigError extends Error {
  constructor(errors) {
    super("Configuration validation failed!");
    this.errors = errors;
  }
}

function updateConfig(config, str) {
  const { key, op, value } = split(str);
  const keys = key.replace(/\[([^\]]+)\]/g, ".$1").split(".");
  let obj = config;
  let setValue = () => {};
  for (let k of keys) {
    if (!k) {
      throw new Error(`Invalid key: ${key}`);
    }
    if (obj == null) {
      throw new Error(`Key refers to missing object: ${key} (${k})`);
    }
    const orig = obj;
    setValue = () => {
      if (op === "+" || op === "-") {
        if (orig[k] == null) {
          orig[k] = [];
        } else if (!Array.isArray(orig[k])) {
          orig[k] = [orig[k]];
        }
        if (op === "+") {
          orig[k].push(value);
        } else if (op === "-") {
          orig[k] = orig[k].filter(s => s !== value);
        }
      } else {
        if (Array.isArray(orig[k]) && !Array.isArray(value)) {
          orig[k] = [value];
        } else {
          orig[k] = value;
        }
      }
    };
    obj = obj[k];
  }
  setValue();
}

function split(str) {
  const arr = str.split("=", 2);
  if (arr.length !== 2) {
    throw new Error(`Invalid argument: ${str}`);
  }
  const value =
    arr[1].startsWith("{") || arr[1].startsWith("[")
      ? JSON.parse(arr[1])
      : arr[1] === "true"
      ? true
      : arr[1] === "false"
      ? false
      : arr[1].trim();
  const op = arr[0].slice(-1);
  if (op === "+" || op === "-") {
    const key = arr[0].slice(0, -1).trim();
    return { key, op, value };
  } else {
    return { key: arr[0].trim(), op: "=", value };
  }
}

module.exports = { readConfig, checkConfig, ConfigError, updateConfig };
