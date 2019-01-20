const { bind, unit } = require("./builtin");
const run = require("./run");
const make = require("./make");

function eff(executor, ...params) {
  return make(executor, params);
}

module.exports = {
  eff,
  bind,
  unit,
  run
};
