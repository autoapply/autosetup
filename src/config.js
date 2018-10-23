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
  deployment: {
    template: string,
    namespace: string,
    tolerations: boolean,
    sleep: number,
    repository?: string,
    git: {
      args: string
    },
    image: string,
    path: string | [string]
  }
};

const defaultConfig: Config = {
  api: "v1",
  secretProviders: {},
  secrets: {},
  deployment: {
    template: "simple",
    namespace: "default",
    tolerations: true,
    sleep: 30,
    git: {
      args: "--depth 1 --single-branch"
    },
    image: "autoapply/autoapply:0.8.0-kubectl",
    path: "."
  }
};

function createConfig(repository: string): Config {
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

module.exports = { createConfig, parseConfig };
