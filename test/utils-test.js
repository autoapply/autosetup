const { describe, it } = require("mocha");
const { expect } = require("chai");

const { getHostname } = require("../lib/utils");

describe("utils", () => {
  describe("getHostname", () => {
    it("should get the hostname", () => {
      expect(getHostname("git@example.com:a/b.git")).equals("example.com");
    });

    it("should get the hostname when the path is missing", () => {
      expect(getHostname("git@example.com")).equals("example.com");
    });

    it("should get the hostname when only the host is given", () => {
      expect(getHostname("example.com")).equals("example.com");
    });

    it("should get the hostname when a different user is given", () => {
      expect(getHostname("ssh-123@example.com")).equals("example.com");
    });
  });
});
