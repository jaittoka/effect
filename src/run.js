const isEffect = require("./isEffect")(e => typeof e === "function");

function run(eff) {
  if (!isEffect(eff)) {
    return eff;
  }
  try {
    return Promise.resolve(eff.executor.call(null, ...eff.params));
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports = run;
