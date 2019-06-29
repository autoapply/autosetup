const { resolve } = require("path");

const { readFile } = require("fs-extra");
const { describe, it } = require("mocha");
const { expect } = require("chai");

const { readConfig } = require("../lib/config");
const { generate } = require("../lib/autosetup");

const outputPath = resolve(__dirname, "./resources");

describe("autosetup", () => {
  it("should create the expected output", async () => {
    const config = await readConfig();
    config.git.url = "https://github.com/autoapply/template-kubectl";
    config.secrets.gpg = ".";

    const output = await generate(config);

    const expected = await readFile(
      resolve(outputPath, "expected-output-simple.yaml"),
      "utf8"
    );

    expect(output).equals(expected);
  });
});
