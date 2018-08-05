const { template } = require("./utils");

async function buildSimpleModel(context) {
  processSecrets(context);
  return join([
    await template("namespace.yaml.tpl", context),
    await template("rbac.yaml.tpl", context),
    await template("secrets.yaml.tpl", context),
    await template("deployment-simple.yaml.tpl", context)
  ]);
}

function processSecrets(context) {
  for (const key in context.secrets) {
    if (context.secrets.hasOwnProperty(key)) {
      const secret = context.secrets[key];
      if (!secret.value) {
        throw new Error(`Missing secret.value: ${key}`);
      }
      if (!secret.kubernetesName) {
        secret.kubernetesName = `autoapply-${key.toLowerCase()}-secret`;
      }
      if (!secret.envName) {
        secret.envName = key.replace(/-/g, "_");
      }
      if (!secret.kubernetesType) {
        secret.kubernetesType =
          secret.type === "dockercfg" ? "kubernetes.io/dockercfg" : "Opaque";
      }
      if (secret.kubernetesType === "kubernetes.io/dockercfg") {
        secret.envName = ".dockercfg";
      }
      secret.valueBase64 = Buffer.from(secret.value).toString("base64");
    }
  }
}

function join(model) {
  let str = "";
  for (const m of model) {
    if (str) {
      if (!str.endsWith("---")) {
        str += "\n---";
      }
      str += "\n";
    }
    str += m.trim();
  }
  if (str.endsWith("---")) {
    str = str.substr(0, str.length - 3).trimRight();
  }
  return str;
}

module.exports = { buildSimpleModel };
