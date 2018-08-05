const path = require("path");

const logger = require("winston");
const spawn = require("child-process-promise").spawn;
const fse = require("fs-extra");
const ejs = require("ejs");

const templatesPath = path.resolve(__dirname, "../templates");

async function template(name, context, args = {}) {
  const content = await fse.readFile(path.resolve(templatesPath, name), "utf8");
  return ejs.render(content, Object.assign({ ctx: context }, args));
}

async function run(cmd, args) {
  const cmdStr = [cmd, ...args].join(" ");
  logger.debug("Executing command:", cmdStr);
  const options = { capture: ["stdout", "stderr"] };
  const result = await spawn(cmd, args, options).then(
    result => result,
    e => {
      logger.debug("Error executing command:", cmdStr);
      logger.debug("stdout:", (e.stdout || "").trimRight());
      logger.debug("stderr:", (e.stderr || "").trimRight());
      throw e;
    }
  );
  return result.stdout;
}

module.exports = { template, run };
