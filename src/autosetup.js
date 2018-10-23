#!/usr/bin/env node

"use strict";

const process = require("process");

const cli = require("./cli");

if (require.main === module) {
  cli.main().catch(err => {
    process.exitCode = 1;
    // eslint-disable-next-line no-console
    console.error(err.message || "unknown error!");
  });
}
