var Q     = require("q");
var Queue = require("./queue");


/**
 * 
 * @class PageQueue
 * 
 * @param {!Objcet} options
 *   The options to customise the behaviour of the queue.
 *   Possible attributes are:
 *     * logger: An optional logger object to use.
 */
var PageQueue = module.exports = function(options) {
  this._logger = options.logger || require("./default-logger");
  this._queue  = new Queue();
  this._seen   = {};
};

/**
 * Adds a uri to the queue the first time it is seen otherwise does nothing.
 * @param {!String} uri The uri to, possibly, enqueue.
 * @returns {!Boolean} True if the uri was added.
 */
PageQueue.prototype.enqueue = function(uri) {
  if (uri in this._seen) {
    this._logger.debug("Ingoring enqueue of visited uri: %s", uri);
    return false;
  }
  this._seen[uri] = true;
  this._queue.push(uri);
  return true;
};

/**
 * Processes all the elements in the queue.
 * 
 * Each element is popped from the top and passed to callback.
 * Once the callback is completed the next element of the queue is processed
 * until there are no more elements.
 * The callback can therefore enqueue new elements, which will be processed.
 * 
 * The return value of the callback is igored unless it is a promise, in which
 * case processing is paused until that promise completes.
 * 
 * @param {!Function} callback    The operation to perform on each uri.
 * @param {=Number}   concurrency The number of concurrent promises to wait for.
 * @returns {Q.Promise} A promise that resolves when processing is done.
 */
PageQueue.prototype.process = function(callback, concurrency) {
  var promise  = null;
  concurrency  = concurrency || 1;

  if (this._queue.count()) {
    var _this = this;
    var max   = Math.min(concurrency, this._queue.count());
    var vals  = [];

    for (var idx = 0; idx < max; idx++) {
      var uri = this._queue.pop();
      _this._logger.debug("Processing uri: %s", uri);
      vals.push(callback(uri));
    }

    promise = Q.all(vals).then(function() {
      return _this.process(callback, concurrency);
    });
  } else {
    var deferred = Q.defer();
    promise = deferred.promise;
    deferred.resolve();
  }

  return promise;
};
