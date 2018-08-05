const logger = require("winston");
const argparse = require("argparse");

require("pkginfo")(module);

const config = require("./config");
const setup = require("./setup");

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
  parser.addArgument(["-n", "--dry-run"], {
    action: "storeTrue",
    help: "Don't execute any commands, only output what would be done"
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

  const cfg = await config.parseConfig(args.config);

  const options = {
    dryRun: !!args["dry_run"],
    output: args.output
  };

  try {
    await setup.setup(cfg, options);
  } catch (e) {
    if (e.stack) {
      logger.debug("Error!", e.stack);
    }
    throw e;
  }
}

module.exports = { main };
