const { template, joinYaml, getHostname, run } = require("./utils");

async function prepare(config) {
  await setMissingHostKey(config);
}

async function setMissingHostKey(config) {
  if (config.secrets.ssh && !config.secrets["ssh-host-key"]) {
    const hostname = getHostname(config.git.url);
    const hostkey = await run("ssh-keyscan", [hostname]);
    // eslint-disable-next-line require-atomic-updates
    config.secrets["ssh-host-key"] = hostkey;
  }
}

async function generate(config) {
  const ctx = { config };

  ctx.secrets = createSecrets(ctx.config.secrets);
  ctx.dockercfg = createDockercfg(ctx.config.secrets);

  ctx.allNamespaces = parseAllNamespaces(config);
  ctx.accessNamespaces = parseAccessNamespaces(config);

  ctx.autoapply = {
    config: parseConfig(config.autoapply.config),
    init: filterCommands(ctx, config.autoapply.init),
    commands: filterCommands(ctx, config.autoapply.commands)
  };

  return joinYaml([
    await template("namespace.yaml.tpl", ctx),
    await template("dockercfg.yaml.tpl", ctx),
    await template("rbac.yaml.tpl", ctx),
    await template("secrets.yaml.tpl", ctx),
    await template("deployment.yaml.tpl", ctx)
  ]);
}

function parseAllNamespaces(config) {
  const namespaces = [config.kubernetes.namespace];
  if (Array.isArray(config.kubernetes["namespace-access"])) {
    for (const namespace of config.kubernetes["namespace-access"]) {
      if (!namespaces.includes(namespace)) {
        namespaces.push(namespace);
      }
    }
  }
  return namespaces;
}

function parseAccessNamespaces(config) {
  if (config.kubernetes["namespace-access"] == null) {
    return [config.kubernetes.namespace];
  } else if (Array.isArray(config.kubernetes["namespace-access"])) {
    return config.kubernetes["namespace-access"];
  } else {
    throw new Error("Invalid value for kubernetes.namespace-access!");
  }
}

function parseConfig(config) {
  if (config == null) {
    return "";
  } else if (typeof config == "string") {
    return config.trim();
  } else if (typeof config == "object") {
    return JSON.stringify(config, null, "  ");
  } else {
    throw new Error("Invalid value for autoapply.config!");
  }
}

function filterCommands(ctx, commands) {
  const result = [];

  for (const command of commands) {
    if (command === "$write-ssh-keys") {
      if (ctx.secrets.SSH || ctx.secrets.SSH_HOST_KEY) {
        result.push("mkdir -p -m 700 ~/.ssh");
        if (ctx.secrets.SSH) {
          result.push(
            'echo "${SSH}" > ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa'
          );
        }
        if (ctx.secrets.SSH_HOST_KEY) {
          result.push('echo "${SSH_HOST_KEY}" > ~/.ssh/known_hosts');
        }
      }
    } else if (command === "$import-gpg-keys") {
      if (ctx.secrets.GPG) {
        result.push('echo "${GPG}" | gpg --import');
      }
    } else if (command === "$git-clone") {
      const args =
        (ctx.config.git.branch ? `-b '${ctx.config.git.branch}' ` : "") +
        ctx.config.git.args;
      result.push(`git clone ${args} '${ctx.config.git.url}' '.'`);
    } else if (command === "$yaml-crypt-decrypt") {
      const secrets = ctx.config.secrets["yaml-crypt"];
      for (let index = 1; index <= secrets.length; index++) {
        for (const path of ctx.config.secrets.paths) {
          const key = `"env:YAML_CRYPT_${index}"`;
          result.push(`yaml-crypt -k ${key} -R --continue -d '${path}'`);
        }
      }
    } else if (command === "$sops-decrypt") {
      if (Object.keys(ctx.config.secrets.sops).length > 0) {
        const sops = "sops --decrypt --in-place '{}'";
        for (const path of ctx.config.secrets.paths) {
          result.push(
            `find '${path}' -type f -regex '.*.ya*ml' -exec ${sops} \\;`
          );
        }
      }
    } else if (command === "$kubectl-apply") {
      const paths = ctx.config.kubernetes.paths;
      const args =
        (ctx.config.kubernetes.recursive ? " -R" : "") +
        (ctx.config.kubernetes.prune
          ? " --prune -l 'provider!=kubernetes,component!=autoapply' " +
            ctx.config.kubernetes["prune-whitelist"]
              .map(s => `--prune-whitelist '${s}'`)
              .join(" ")
          : "");
      if (ctx.config.kubernetes.kustomize && paths.length > 1) {
        const kustomize = paths
          .map(p => `kubectl kustomize '${p}'`)
          .join(" && echo '---' && ");
        const out = "KUSTOMIZE_OUTPUT";
        const generate = `${out}="$(${kustomize})" && echo "\${${out}}"`;
        result.push(`${generate} | kubectl apply${args} -f -`);
      } else {
        const pathArgs = paths
          .map(p => `${ctx.config.kubernetes.kustomize ? "-k" : "-f"} '${p}'`)
          .join(" ");
        result.push(`kubectl apply${args} ${pathArgs}`);
      }
    } else {
      result.push(command);
    }
  }

  return result
    .map(command => command.trim())
    .filter(command => command.length > 0);
}

function createSecrets(secrets) {
  const result = {
    SSH: secrets.ssh,
    SSH_HOST_KEY: secrets["ssh-host-key"],
    GPG: secrets.gpg
  };

  secrets["yaml-crypt"].forEach(
    (key, index) => (result[`YAML_CRYPT_${index + 1}`] = key)
  );

  for (const [key, value] of Object.entries(secrets.sops)) {
    result[key] = value;
  }

  for (const [key, value] of Object.entries(secrets.others)) {
    result[key] = value;
  }

  const filtered = {};
  for (const [key, value] of Object.entries(result)) {
    if (value) {
      filtered[key] = base64(value);
    }
  }

  return filtered;
}

function createDockercfg(secrets) {
  if (secrets.dockercfg) {
    return base64(secrets.dockercfg);
  } else if (secrets.docker.length > 0) {
    const dockercfg = {};
    for (const entry of secrets.docker) {
      const { server, username, password, email } = entry;
      dockercfg[server] = {
        username,
        password,
        email: email || `${username}@${server}`,
        auth: base64(`${username}:${password}`)
      };
    }
    return base64(JSON.stringify(dockercfg));
  } else {
    return "";
  }
}

function base64(str) {
  return str ? Buffer.from(str).toString("base64") : "";
}

module.exports = { prepare, generate };
