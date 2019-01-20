const run = require("./run");
const make = require("./make");

function EXECUTE_BIND(eff, next) {
  return run(eff).then(a => run(next(a)));
}

function EXECUTE_UNIT(v) {
  return Promise.resolve(v);
}

function isUnit(eff) {
  return eff.executor === EXECUTE_UNIT;
}

function isBind(eff) {
  return eff.executor === EXECUTE_BIND;
}

function bind(eff, next) {
  return make(EXECUTE_BIND, [eff, next]);
}

function unit(value) {
  return make(EXECUTE_UNIT, [value]);
}

module.exports = {
  bind,
  unit,
  isUnit,
  isBind
};
