#!/usr/bin/env node

"use strict";

const process = require("process");

const cli = require("../lib/cli");

if (require.main === module) {
  cli.main().catch(err => {
    process.exitCode = 1;
    console.error(err.message || "unknown error!");
  });
}
