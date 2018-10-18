const path = require("path");

const winston = require("winston");
const spawn = require("child-process-promise").spawn;
const fse = require("fs-extra");
const ejs = require("ejs");

const templatesPath = path.resolve(__dirname, "../templates");

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: Object.keys(winston.config.npm.levels)
    })
  ]
});

async function template(name, context, args = {}) {
  const content = await fse.readFile(path.resolve(templatesPath, name), "utf8");
  return ejs.render(content, Object.assign({ ctx: context }, args));
}

async function run(cmd, args) {
  const cmdStr = [cmd, ...args].join(" ");
  logger.debug("Executing command: %s", cmdStr);
  const options = { capture: ["stdout", "stderr"] };
  const result = await spawn(cmd, args, options).then(
    result => result,
    e => {
      logger.debug("Error executing command: %s", cmdStr);
      logger.debug("stdout: %s", (e.stdout || "").trimRight());
      logger.debug("stderr: %s", (e.stderr || "").trimRight());
      throw e;
    }
  );
  return result.stdout;
}

module.exports = { logger, template, run };
