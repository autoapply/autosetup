const logger = require("winston");
const fse = require("fs-extra");

require("pkginfo")(module);

const ssh = require("./ssh");
const azure = require("./azure");
const kubernetes = require("./kubernetes");
const utils = require("./utils");

async function setup(config, options) {
  if (config.api !== "v1") {
    throw new Error("Unknown API version: " + config.api);
  }

  if (config.deployment.template !== "simple") {
    throw new Error(
      "Unknown deployment template: " + context.deployment.template
    );
  }

  const { output } = options;
  if (output !== "-") {
    const exists = await fse.exists(output);
    if (exists) {
      throw new Error("Output file exists: " + output);
    }
  }

  const context = {
    pkginfo: {
      version: module.exports.version
    },
    notes: [],
    model: "",
    options,
    secretProviders: config.secretProviders,
    deployment: config.deployment
  };

  context.notes.push(await utils.template("note-header.tpl", context));
  context.notes.push(await utils.template("note-kubernetes.tpl", context));
  context.notes.push(await utils.template("note-repository.tpl", context));

  configureRepository(context);
  await configureSecrets(config, context);
  context.model = await kubernetes.buildSimpleModel(context);

  if (context.secrets.ssh) {
    const publicKey = await ssh.extractPublicKey(context.secrets.ssh.value);
    context.notes.push(
      await utils.template("note-ssh-key.tpl", context, { publicKey })
    );
  }

  const str = joinAll(context);
  if (output === "-") {
    console.log(str);
  } else {
    const fd = await fse.open(output, "wx");
    try {
      await fse.write(fd, str + "\n");
    } finally {
      await fse.close(fd);
    }
    logger.info("File has been written successfully:", output);
  }
}

function configureRepository(context) {
  if (!context.deployment.repository) {
    throw new Error("deployment.repository missing!");
  }
  const repository = context.deployment.repository.trim();
  const match = repository.match(
    /^(?:git@|https:\/\/)(github|gitlab).com(?:\/|:)(.+)$/
  );
  if (match) {
    context.deployment[match[1]] = {
      path: match[2].replace(/\.git$/, "")
    };
  }
}

async function configureSecrets(config, context) {
  context.secrets = {};
  for (const key in config.secrets) {
    if (config.secrets.hasOwnProperty(key)) {
      const secret = config.secrets[key];
      if (!["ssh-key", "raw", "dockercfg"].includes(secret.type)) {
        throw new Error("Unknown secret.type in secret: " + key);
      }
      if (secret.source) {
        if (secret.value) {
          throw new Error("Both secret.source and secret.value given: " + key);
        }
        secret.value = await loadSecretValue(context, secret);
      }
      if (!secret.value && secret.type === "ssh-key") {
        const sshKey = await ssh.generateKey(secret.keySize);
        logger.debug("Generated public SSH key:", sshKey.publicKey);
        secret.value = sshKey.privateKey;
      }
      if (!secret.value) {
        throw new Error("Missing secret.value: " + key);
      }
      context.secrets[key] = secret;
    }
  }
}

async function loadSecretValue(context, secret) {
  const { source } = secret;
  const provider = context.secretProviders[source.provider];
  if (!provider) {
    throw new Error("No secretProvider found: " + source.provider);
  }
  if (provider.type === "azure-key-vault") {
    return await azure.loadSecret(
      provider.subscription,
      provider.keyVault,
      source.name
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
