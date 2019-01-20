const isEffect = require("./isEffect")(e => e !== undefined);
const { isBind } = require("./builtin");

const TooFewMocksError = new Error(
  "The effect chain contains more steps than was given in the mocks"
);

function simulate(eff, mocks, offset = 0, next = undefined) {
  if (!isEffect(eff)) {
    return Promise.reject(InvalidEffectError);
  }

  if (isBind(eff)) {
    return simulate(eff.params[0], mocks, offset, eff.params[1]);
  }

  if (offset >= mocks.length) {
    return Promise.reject(TooFewMocksError);
  }

  const mock = mocks[offset];

  if (typeof mock !== "function") {
    return Promise.reject(new Error("Mock array must contain functions"));
  }

  if (next !== undefined && typeof next !== "function") {
    return Promise.reject(new Error("Next must be a function"));
  }

  return Promise.resolve(mock.call(null, ...eff.params)).then(result =>
    next ? simulate(next(result), mocks, offset + 1) : Promise.resolve(result)
  );
}

module.exports = simulate;
