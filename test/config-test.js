// @flow

const { describe, it } = require("mocha");
const { expect } = require("chai");

const { updateConfig } = require("../src/config");

describe("config", () => {
  it("should update the config (simple)", function() {
    const config = {
      a: 1
    };
    updateConfig(config, "a=2");
    expect(config.a).equals("2");
  });

  it("should update the config (add new entry)", function() {
    const config = {
      a: 1
    };
    updateConfig(config, "b=2");
    expect(config.b).equals("2");
  });

  it("should update the config (nested)", function() {
    const config = {
      a: {
        b: [
          {
            c: 100
          }
        ]
      }
    };
    updateConfig(config, "a.b[0].c=2");
    expect(config.a.b[0].c).equals("2");
  });

  it("should not update the config when key is invalid", function() {
    const config = {
      a: 1
    };
    expect(() => updateConfig(config, "b.c.d=2")).throws(
      "Key refers to missing object: b.c.d (c)"
    );
  });
});
