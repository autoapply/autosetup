#!/usr/bin/env node

"use strict";

const process = require("process");

const cli = require("./cli");

if (require.main === module) {
  cli.main().catch(err => {
    process.exitCode = 1;
    console.error(err.message || "unknown error!");
  });
}
