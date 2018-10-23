// @flow

const fse = require("fs-extra");
const argparse = require("argparse");

require("pkginfo")(module);

const { logger } = require("./utils");
const { parseConfig } = require("./config");
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
  parser.addArgument(["config"], {
    metavar: "<configuration>",
    help: "Configuration file to use"
  });
  parser.addArgument(["output"], {
    metavar: "<output>",
    defaultValue: "-",
    nargs: "?",
    help: "Output file to write"
  });

  const args = parser.parseArgs();
  if (args.debug && logger.level === "info") {
    logger.level = "debug";
  }

  const config = await parseConfig(args.config);

  const options = {
    output: args.output
  };

  try {
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

module.exports = { main };
