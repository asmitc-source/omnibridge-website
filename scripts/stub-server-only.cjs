/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS preload, require is intended */
// Test-only preload: lets plain Node import modules that `import "server-only"`
// (that package throws outside Next's react-server bundler condition).
const Module = require("node:module");
const path = require("node:path");
const empty = path.join(__dirname, "empty.cjs");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return empty;
  return orig.call(this, request, ...rest);
};
