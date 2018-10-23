// @flow

const path = require("path");

const tmp = require("tmp-promise");
const fse = require("fs-extra");

const utils = require("./utils");

async function generateKey(keySize?: string | number) {
  keySize = keySize || 4096;
  const dir = await tmp.dir({ unsafeCleanup: true });
  try {
    const privateKeyFile = path.resolve(dir.path, "id_rsa");
    const publicKeyFile = path.resolve(dir.path, "id_rsa.pub");
    await utils.run("ssh-keygen", [
      "-b",
      keySize.toString(),
      "-N",
      "",
      "-C",
      "autoapply",
      "-f",
      privateKeyFile
    ]);
    const privateKey = await readFile(privateKeyFile);
    const publicKey = await readFile(publicKeyFile);
    return { privateKey, publicKey };
  } finally {
    dir.cleanup();
  }
}

async function readFile(path) {
  const content = await fse.readFile(path, "utf8");
  return content.trim();
}

async function extractPublicKey(key: string) {
  const dir = await tmp.dir({ unsafeCleanup: true });
  try {
    const keyFile = path.resolve(dir.path, "id_rsa");
    await fse.writeFile(keyFile, key);
    await fse.chmod(keyFile, 0o600);
    const result = await utils.run("ssh-keygen", ["-y", "-f", keyFile]);
    return result.trim();
  } finally {
    dir.cleanup();
  }
}

async function fetchPublicHostKey(host: string) {
  await utils.run("ssh-keyscan", [host]);
}

module.exports = { generateKey, extractPublicKey, fetchPublicHostKey };
