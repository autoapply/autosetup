// @flow

const fse = require("fs-extra");
const argparse = require("argparse");

require("pkginfo")(module);

const { logger } = require("./utils");
const { createConfig, parseConfig, updateConfig } = require("./config");
const setup = require("./setup");

export type Options = {
  output: string
};

async function main() {
  const parser = new argparse.ArgumentParser({
    prog: module.exports.name,
    version: module.exports.version,
    addHelp: true,
    description: module.exports.description
  });
  parser.addArgument(["-d", "--debug"], {
    action: "storeTrue",
    help: "Show debugging output"
  });
  parser.addArgument(["-c"], {
    metavar: "<name>=<value>",
    action: "append",
    help: "Set configuration values"
  });
  parser.addArgument(["-o"], {
    metavar: "<output>",
    defaultValue: "-",
    help: "Output file to write"
  });
  parser.addArgument(["config"], {
    metavar: "<configuration>",
    nargs: "?",
    help: "Configuration file to use"
  });

  const args = parser.parseArgs();
  if (args.debug && logger.level === "info") {
    logger.level = "debug";
  }

  try {
    const config = args.config
      ? await parseConfig(args.config)
      : createConfig();

    if (args.c) {
      for (const arg of args.c) {
        const arr = arg.split("=", 2);
        if (arr.length !== 2) {
          throw new Error(`Invalid argument: ${arg}`);
        }
        updateConfig(config, arr[0], arr[1]);
      }
    }

    const options = {
      output: args.o
    };

    await run(config, options);
  } catch (e) {
    if (e.stack) {
      logger.debug("Error!", e.stack);
    }
    throw e;
  }
}

async function run(config, options) {
  const { output } = options;
  if (output !== "-") {
    const exists = await fse.exists(output);
    if (exists) {
      throw new Error("Output file exists: " + output);
    }
  }

  const str = await setup.setup(config, options);

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
    logger.info("File has been written successfully: %s", output);
  }
}

module.exports.main = main;
