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
    git: {
      args: "--depth 1 --single-branch"
    },
    image: "autoapply/autoapply:0.8.0-kubectl",
    path: "."
  }
};

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
  return config;
}

function updateConfig(config: Config, key: string, value: string) {
  if (!key || !key.length) {
    throw new Error("Missing argument: key");
  }
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
    setValue = () => (orig[k] = value);
    obj = obj[k];
  }
  setValue();
}

module.exports = { createConfig, parseConfig, updateConfig };
