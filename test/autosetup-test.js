const { resolve } = require("path");

const { readFile } = require("fs-extra");
const { describe, it } = require("mocha");
const { expect } = require("chai");

const { readConfig, checkConfig } = require("../lib/config");
const { generate } = require("../lib/autosetup");

const outputPath = resolve(__dirname, "./resources");

async function checkOutput(callback, outputFile) {
  const config = await readConfig();
  callback(config);
  await checkConfig(config);

  const output = await generate(config);
  const expected = await readFile(resolve(outputPath, outputFile), "utf8");

  expect(output).equals(expected);
}

describe("autosetup", () => {
  it("should create expected output (simple)", async () => {
    await checkOutput(config => {
      config.git.url = "https://github.com/autoapply/template-kubectl";
      config.secrets.gpg = "123";
      config.secrets.sops = { TEST: "123" };
      config.kubernetes.recursive = true;
    }, "expected-output-simple.yaml");
  });

  it("should create expected output (kustomize)", async () => {
    await checkOutput(config => {
      config.git.url = "https://github.com/autoapply/template-kubectl";
      config.secrets.gpg = "123";
      config.secrets.sops = { TEST: "123" };
      config.secrets.paths = ["common", "dev"];
      config.kubernetes.kustomize = true;
      config.kubernetes.paths = ["dev"];
    }, "expected-output-kustomize.yaml");
  });
});
