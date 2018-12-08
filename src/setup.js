// @flow

require("pkginfo")(module);

const ssh = require("./ssh");
const azure = require("./azure");
const kubernetes = require("./kubernetes");
const utils = require("./utils");
const { logger } = require("./utils");

import type { Config } from "./config";
import type { Options } from "./cli";

export type Context = {
  version: string,
  output: string,
  notes: string[],
  model: string,
  secrets: {
    [string]: {
      type: string,
      value: string,
      valueBase64: string,
      kubernetesName?: string,
      kubernetesType?: string,
      kubernetesEnvName?: string
    }
  },
  deployment: {
    namespace: string,
    tolerations: boolean,
    image: string,
    git: {
      args: string
    },
    repository: {
      url: string,
      urlType: "ssh" | "http" | "https" | "unknown"
    },
    path: string[],
    prune: boolean,
    pruneWhitelist: string[],
    sleep: number
  }
};

async function setup(config: Config, options: Options): Promise<string> {
  if (config.api !== "v1") {
    throw new Error("Unknown API version: " + config.api);
  }

  if (config.deployment.template !== "simple") {
    throw new Error(
      "Unknown deployment template: " + config.deployment.template
    );
  }

  const context: Context = {
    version: module.exports.version,
    output: options.output,
    notes: [],
    model: "",
    deployment: {
      namespace: config.deployment.namespace,
      tolerations: config.deployment.tolerations,
      image: config.deployment.image,
      git: config.deployment.git,
      repository: getRepositoryContext(config),
      path: Array.isArray(config.deployment.path)
        ? config.deployment.path
        : [config.deployment.path],
      prune: config.deployment.prune,
      pruneWhitelist: config.deployment.pruneWhitelist,
      sleep: config.deployment.sleep
    },
    secrets: await getSecretsContext(config)
  };

  if (context.deployment.path.length < 1) {
    throw new Error("Empty deployment.path array!");
  }

  context.notes.push(await utils.template("note-header.tpl", context));
  context.notes.push(await utils.template("note-kubernetes.tpl", context));
  context.notes.push(await utils.template("note-repository.tpl", context));

  if (context.deployment.repository.urlType === "ssh") {
    if (!context.secrets.ssh) {
      logger.warn("SSH repository URL, but secrets.ssh missing!");
    }
    if (!context.secrets.knownHosts) {
      logger.warn("SSH repository URL, but secrets.knownHosts missing!");
    }
  }

  context.model = await kubernetes.buildSimpleModel(context);

  if (context.secrets.ssh) {
    const publicKey = await ssh.extractPublicKey(context.secrets.ssh.value);
    context.notes.push(
      await utils.template("note-ssh-key.tpl", context, { publicKey })
    );
  }

  return joinAll(context);
}

function getRepositoryContext(config) {
  if (!config.deployment.repository) {
    throw new Error("deployment.repository missing!");
  }
  const url = config.deployment.repository.trim();
  // URL type:
  const urlMatch = url.match(
    /((git|ssh|http(s)?)|([\w-]+@[\w.-]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)?(\/)?/
  );
  let urlType;
  if (urlMatch) {
    if (urlMatch[2]) {
      urlType = urlMatch[2];
    } else {
      urlType = "ssh";
    }
  } else {
    urlType = "unknown";
  }
  const repository = {
    url,
    urlType
  };
  // github/gitlab info:
  const hostMatch = url.match(
    /^(?:git@|https:\/\/)(github|gitlab).com(?:\/|:)(.+)$/
  );
  if (hostMatch) {
    repository[hostMatch[1]] = {
      path: hostMatch[2].replace(/\.git$/, "")
    };
  }
  return repository;
}

async function getSecretsContext(config) {
  const secrets = {};
  for (const name of Object.keys(config.secrets)) {
    const secret = config.secrets[name];
    let value;
    if (secret.source) {
      value = await loadSecretValue(config, secret);
    } else if (secret.value) {
      value = secret.value;
    } else if (secret.type === "ssh-key") {
      const sshKey = await ssh.generateKey(secret.keySize);
      logger.debug(`Generated public SSH key: ${sshKey.publicKey}`);
      value = sshKey.privateKey;
    } else {
      throw new Error("Invalid secret: " + name);
    }
    secrets[name] = {
      type: secret.type,
      value,
      valueBase64: Buffer.from(value).toString("base64")
    };
  }
  return secrets;
}

async function loadSecretValue(config, secret) {
  if (!secret.source) {
    throw new Error("No provider given!");
  }
  const provider = config.secretProviders[secret.source.provider];
  if (!provider) {
    throw new Error("No secretProvider found: " + secret.source.provider);
  }
  if (provider.type === "azure-key-vault") {
    logger.info(
      `Loading secret from ${provider.keyVault}: ${secret.source.name}...`
    );
    return await azure.loadSecret(
      provider.subscription,
      provider.keyVault,
      secret.source.name
    );
  } else {
    throw new Error("Unknown provider type: " + provider.type);
  }
}

function joinAll(context) {
  let result = "";
  for (const note of context.notes) {
    if (result.length) {
      result += "\n";
    }
    result += "#\n";
    result += note.trim();
  }
  if (context.notes.length) {
    result += "\n#";
  }
  if (result.length) {
    result += "\n";
  }
  result += context.model;
  return result.trim();
}

module.exports.setup = setup;
