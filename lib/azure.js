const utils = require("./utils");

async function loadSecret(subscription, keyVault, secret) {
  let result;
  try {
    result = await utils.run("az", [
      "keyvault",
      "secret",
      "show",
      "--subscription",
      subscription,
      "--vault-name",
      keyVault,
      "--name",
      secret
    ]);
  } catch (e) {
    if (e.stderr) {
      throw new Error(`Command failed: ${e.stderr.trim()}`);
    } else {
      throw e;
    }
  }
  const obj = JSON.parse(result);
  if (!obj.value) {
    throw new Error("Could not parse output, missing value!");
  }
  return obj.value;
}

module.exports = { loadSecret };
