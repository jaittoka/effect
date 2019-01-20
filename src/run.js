const isEffect = require("./isEffect")(e => typeof e === "function");

function run(eff) {
  if (!isEffect(eff)) {
    return eff;
  }
  return Promise.resolve(eff.executor.call(null, ...eff.params));
}

module.exports = run;
