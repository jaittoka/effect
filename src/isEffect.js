module.exports = isExecutorOk => value =>
  typeof value === "object" &&
  isExecutorOk(value.executor) &&
  Array.isArray(value.params);
