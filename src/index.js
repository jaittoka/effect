const EFF_TAG = Symbol();

function EXECUTE_BIND(eff, next) {
  return run(eff).then(a => {
    const nextEffect = next(a);
    if (isEffect(nextEffect)) {
      return run(nextEffect);
    } else {
      return nextEffect;
    }
  });
}

function EXECUTE_UNIT(v) {
  return Promise.resolve(v);
}

function make(obj) {
  return { ...obj, _ef_tag_: EFF_TAG };
}

function isEffect(value) {
  return (
    typeof value === "object" && value._ef_tag_ === EFF_TAG,
    typeof value.executor === "function" && Array.isArray(value.params)
  );
}

function isUnit(eff) {
  return eff.executor === EXECUTE_UNIT;
}

function isBind(eff) {
  return eff.executor === EXECUTE_BIND;
}

function eff(executor, ...params) {
  return make({ executor, params });
}

function bind(eff, next) {
  return make({ executor: EXECUTE_BIND, params: [eff, next] });
}

function unit(value) {
  return make({ executor: EXECUTE_UNIT, params: [value] });
}

function run(eff) {
  if (!isEffect(eff)) {
    throw new Error(
      "Invalid effect given to Eff.run. Did you create the effect with Eff.eff?"
    );
  }
  return Promise.resolve(eff.executor.call(null, ...eff.params));
}

function simulate(eff, mocks, offset = 0, next = undefined) {
  if (isBind(eff)) {
    return simulate(eff.params[0], mocks, offset, eff.params[1]);
  }

  return Promise.resolve(mocks[offset].call(null, ...eff.params)).then(result =>
    next
      ? simulate(next(result), mocks, offset + 1, null)
      : Promise.resolve(result)
  );
}

module.exports = {
  isEffect,
  isBind,
  isUnit,
  eff,
  bind,
  unit,
  run,
  simulate
};
