// @flow

const fse = require("fs-extra");
const yaml = require("js-yaml");
const deepmerge = require("deepmerge");

type SecretWithValue = {
  type: "raw" | "dockercfg" | "ssh-key",
  keySize?: string | number,
  value: string
};

type SecretWithSource = {
  type: "raw" | "dockercfg" | "ssh-key",
  keySize?: string | number,
  source: {
    provider: string,
    name: string
  }
};

type Secret = $Exact<SecretWithValue> | $Exact<SecretWithSource>;

export type Config = {
  api: "v1",
  secretProviders: {
    [string]: {
      type: string,
      subscription: string,
      keyVault: string
    }
  },
  secrets: {
    [string]: Secret
  },
  deployment: {|
    template: string,
    namespace: string,
    tolerations: boolean,
    prune: boolean,
    pruneWhitelist: string[],
    sleep: number,
    repository?: string,
    build: string | string[],
    git: {
      args: string
    },
    image: string,
    path: string | string[]
  |}
};

const defaultConfig: Config = {
  api: "v1",
  secretProviders: {},
  secrets: {},
  deployment: {
    template: "simple",
    namespace: "default",
    tolerations: true,
    prune: false,
    pruneWhitelist: [
      "core/v1/ConfigMap",
      "core/v1/Endpoints",
      "core/v1/PersistentVolumeClaim",
      "core/v1/Pod",
      "core/v1/ReplicationController",
      "core/v1/Secret",
      "core/v1/Service",
      "batch/v1/Job",
      "batch/v1beta1/CronJob",
      "extensions/v1beta1/DaemonSet",
      "extensions/v1beta1/Deployment",
      "extensions/v1beta1/Ingress",
      "extensions/v1beta1/ReplicaSet",
      "apps/v1beta1/StatefulSet",
      "apps/v1beta1/Deployment"
    ],
    sleep: 30,
    build: [],
    git: {
      args: "--depth 1 --single-branch"
    },
    image: "autoapply/autoapply:0.8.3-kubectl",
    path: "."
  }
};

type Operation = "+" | "=" | "-";

function createConfig(repository: ?string): Config {
  const config = Object.assign({}, defaultConfig);
  config.deployment.repository = repository;
  return config;
}

async function parseConfig(name: string): Promise<Config> {
  const content = await fse.readFile(name);
  const loaded = yaml.safeLoad(content);
  const config = deepmerge(defaultConfig, loaded);
  for (const name of Object.keys(config.secrets)) {
    const secret = config.secrets[name];
    try {
      if (!secret.value && !secret.source) {
        throw new Error("Either value or source need to be given!");
      } else if (secret.value && secret.source) {
        throw new Error("Either value or source need to be given, not both!");
      } else if (secret.keySize && secret.type !== "ssh-key") {
        throw new Error("Invalid property keySize for type " + secret.type);
      } else if (!["raw", "dockercfg", "ssh-key"].includes(secret.type)) {
        throw new Error("Unknown type: " + secret.type);
      }
    } catch (e) {
      throw new Error("Invalid secret " + name + ": " + e.message);
    }
  }
  if (Array.isArray(config.deployment.build)) {
    for (const command of config.deployment.build) {
      if (typeof command !== "string") {
        throw new Error("Invalid build command: " + command);
      }
    }
  }
  return config;
}

function updateConfig(config: Config, str: string) {
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
        orig[k] = value;
      }
    };
    obj = obj[k];
  }
  setValue();
}

function split(str: string): { key: string, op: Operation, value: string } {
  const arr = str.split("=", 2);
  if (arr.length !== 2) {
    throw new Error(`Invalid argument: ${str}`);
  }
  const value = arr[1].trim();
  if (arr[0].slice(-1) === "+" || arr[0].slice(-1) === "-") {
    const key = arr[0].slice(0, -1).trim();
    return { key, op: arr[0].slice(-1), value };
  } else {
    return { key: arr[0].trim(), op: "=", value };
  }
}

module.exports = { createConfig, parseConfig, updateConfig };
