module.exports.debug = function() {
  return console.log.apply(console, arguments);
};

module.exports.info = function() {
  return console.info.apply(console, arguments);
};

module.exports.warn = function() {
  return console.warn.apply(console, arguments);
};

module.exports.error = function() {
  return console.error.apply(console, arguments);
};
