// @flow

const { template } = require("./utils");

import type { Context } from "./setup";

async function buildSimpleModel(context: Context) {
  processSecrets(context);
  return join([
    await template("namespace.yaml.tpl", context),
    await template("rbac.yaml.tpl", context),
    await template("secrets.yaml.tpl", context),
    await template("deployment-simple.yaml.tpl", context)
  ]);
}

function processSecrets(context) {
  for (const name of Object.keys(context.secrets)) {
    const secret = context.secrets[name];
    if (!secret.value) {
      throw new Error(`Missing secret.value: ${name}`);
    }
    if (!secret.kubernetesName) {
      secret.kubernetesName = `autoapply-${name.toLowerCase()}-secret`;
    }
    if (!secret.kubernetesEnvName) {
      secret.kubernetesEnvName = name.replace(/-/g, "_");
    }
    if (!secret.kubernetesType) {
      secret.kubernetesType =
        secret.type === "dockercfg" ? "kubernetes.io/dockercfg" : "Opaque";
    }
    if (secret.kubernetesType === "kubernetes.io/dockercfg") {
      secret.kubernetesEnvName = ".dockercfg";
    }
  }
}

function join(model) {
  let str = "";
  for (const m of model) {
    if (str) {
      if (!str.endsWith("---") && !str.endsWith("---\n")) {
        str += "\n---";
      }
      if (!str.endsWith("\n")) {
        str += "\n";
      }
    }
    str += m.trim();
  }
  if (str.endsWith("---")) {
    str = str.substr(0, str.length - 3).trimRight();
  }
  return str;
}

module.exports = { buildSimpleModel };
