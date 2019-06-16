const { template, joinYaml, getHostname, run } = require("./utils");

async function prepare(config) {
  await setMissingHostKey(config);
}

async function setMissingHostKey(config) {
  if (config.secrets.ssh && !config.secrets["ssh-host-key"]) {
    const hostname = getHostname(config.git.url);
    const hostkey = await run("ssh-keyscan", [hostname]);
    config.secrets["ssh-host-key"] = hostkey;
  }
}

async function generate(config) {
  const ctx = { config };

  ctx.secrets = createSecrets(ctx.config.secrets);
  ctx.dockercfg = createDockercfg(ctx.config.secrets);

  return joinYaml([
    await template("namespace.yaml.tpl", ctx),
    await template("dockercfg.yaml.tpl", ctx),
    await template("rbac.yaml.tpl", ctx),
    await template("secrets.yaml.tpl", ctx),
    await template("deployment.yaml.tpl", ctx)
  ]);
}

function createSecrets(secrets) {
  const result = {
    SSH: secrets.ssh,
    SSH_HOST_KEY: secrets["ssh-host-key"]
  };

  secrets["yaml-crypt"].forEach(
    (key, index) => (result[`YAML_CRYPT_${index + 1}`] = key)
  );

  for (const [key, value] of Object.entries(secrets.sops)) {
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
