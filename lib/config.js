const fse = require("fs-extra");
const yaml = require("js-yaml");
const deepmerge = require("deepmerge");

const defaultConfig = {
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
    image: "pascalgn/autoapply:0.7.4-kubectl",
    path: "."
  }
};

async function parseConfig(name) {
  const content = await fse.readFile(name);
  const loaded = yaml.safeLoad(content);
  const config = deepmerge(defaultConfig, loaded);
  return config;
}

module.exports = { parseConfig };
