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

  it("should create expected output (branch)", async () => {
    await checkOutput(config => {
      config.git.url = "git@github.com:autoapply/template-kubectl.git";
      config.git.branch = "some/branch";
      config.kubernetes.namespace = "test-branch";
      config.kubernetes.paths = ["a", "b"];
    }, "expected-output-branch.yaml");
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

  it("should create expected output (multiple)", async () => {
    await checkOutput(config => {
      config.git.url = "https://github.com/autoapply/template-kubectl";
      config.kubernetes.kustomize = true;
      config.kubernetes.paths = ["common", "dev"];
    }, "expected-output-multiple.yaml");
  });

  it("should create expected output (config string)", async () => {
    await checkOutput(config => {
      config.autoapply.config = JSON.stringify(
        {
          loop: {
            commands: ["date", "ls"]
          },
          server: { enabled: true }
        },
        null,
        "  "
      );
    }, "expected-output-config.yaml");
  });

  it("should create expected output (config object)", async () => {
    await checkOutput(config => {
      config.autoapply.config = {
        loop: {
          commands: ["date", "ls"]
        },
        server: { enabled: true }
      };
    }, "expected-output-config.yaml");
  });
});
