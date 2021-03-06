#!/usr/bin/env node

"use strict";

const fse = require("fs-extra");
const { ArgumentParser } = require("argparse");

require("pkginfo")(module);

const { logger } = require("../lib/utils");
const {
  readConfig,
  updateConfig,
  checkConfig,
  ConfigError
} = require("../lib/config");
const { prepare, generate } = require("../lib/autosetup");

async function main() {
  const parser = new ArgumentParser({
    prog: module.exports.name,
    add_help: true,
    description: module.exports.description
  });

  parser.add_argument("-v", "--version", {
    action: "version",
    version: module.exports.version,
    help: "Show version number and exit"
  });
  parser.add_argument("-d", "--debug", {
    action: "store_true",
    help: "show debugging output"
  });
  parser.add_argument("-c", {
    metavar: "<name>=<value>",
    action: "append",
    help: "set configuration values"
  });
  parser.add_argument("-o", {
    metavar: "<output>",
    default: "-",
    help: "output file to write"
  });
  parser.add_argument("config", {
    metavar: "<configuration>",
    nargs: "?",
    help: "configuration file to use"
  });

  const args = parser.parse_args();
  if (args.debug && logger.level === "info") {
    logger.level = "debug";
  }

  try {
    const config = await readConfig(args.config);

    if (args.c) {
      for (const arg of args.c) {
        updateConfig(config, arg);
      }
    }

    await checkConfig(config);

    await run(config, args.o);
  } catch (e) {
    if (e instanceof ConfigError) {
      const { errors } = e;
      for (const error of errors) {
        // eslint-disable-next-line no-console
        console.error(
          (error.dataPath ? `In path ${error.dataPath}: ` : "") + error.message
        );
      }
    } else if (e.stack) {
      logger.debug(e.stack);
    }
    throw e;
  }
}

async function run(config, output) {
  if (output !== "-") {
    const exists = await fse.exists(output);
    if (exists) {
      throw new Error(`Output file exists: ${output}`);
    }
  }

  await prepare(config);

  const str = await generate(config);

  if (output === "-") {
    logger.info("All templates successfully generated!");
    // eslint-disable-next-line no-console
    console.log(str);
  } else {
    const fd = await fse.open(output, "wx");
    try {
      await fse.write(fd, str + "\n");
    } finally {
      await fse.close(fd);
    }
    logger.info(`File has been written successfully: ${output}`);
  }
}

if (require.main === module) {
  main().catch(err => {
    process.exitCode = 1;
    // eslint-disable-next-line no-console
    console.error(err.message || "unknown error!");
  });
}

module.exports.main = main;
