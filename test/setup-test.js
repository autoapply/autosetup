// @flow

const fse = require("fs-extra");
const { describe, it } = require("mocha");
const { expect } = require("chai");

const { createConfig } = require("../src/config");
const { setup } = require("../src/setup");

describe("setup", () => {
  it("should not use objects in templates", async function() {
    const config = createConfig("https://github.com/help/help");
    const options = { output: "-" };
    const str = await setup(config, options);
    expect(str).not.to.contain("[object Object]");
  });

  it("should contain the sleep time", async function() {
    const config = createConfig("https://github.com/help/help");
    config.deployment.sleep = 99;
    const options = { output: "-" };
    const str = await setup(config, options);
    expect(str).to.contain("every 99 seconds");
    expect(str).to.contain("sleep: 99");
  });

  it("should use the given SSH key", async function() {
    const config = createConfig("https://github.com/help/help");
    config.secrets.ssh = {
      type: "ssh-key",
      value: await fse.readFile("./test/id_ed25519", "ascii")
    };
    const options = { output: "-" };
    const str = await setup(config, options);
    const publicKey = await fse.readFile("./test/id_ed25519.pub", "ascii");
    expect(str).to.contain(publicKey.trim());
  });
});
