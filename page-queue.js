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
 *     * key:    A function to extract a key out of in item.
 *               Defaults to the identity function.
 */
var PageQueue = module.exports = function(options) {
  this._key    = options.key    || function(x) { return x; };
  this._logger = options.logger || require("./loggers/default");
  this._queue  = new Queue();
  this._seen   = {};
};

/**
 * Adds a uri to the queue the first time it is seen otherwise does nothing.
 * @param {!Object} item The item to, possibly, enqueue. Usually this is a URI.
 * @returns {!Boolean} True if the item was added.
 */
PageQueue.prototype.enqueue = function(item) {
  var key = this._key(item);
  if (key in this._seen) {
    this._logger.debug("Ingoring enqueue of visited item with key: %s", key);
    return false;
  }
  this._seen[key] = true;
  this._queue.push(item);
  return true;
};

/**
 * Processes all the elements in the queue.
 * 
 * Each element is popped from the top and passed to callback.
 * Once the callback is completed the next element of the queue is processed
 * until there are no more elements.
 * The callback can therefore enqueue new elements, which will be processed
 * at a later stage of the current loop over the queue.
 * 
 * The return value of the callback is igored unless it is a promise, in which
 * case processing is paused until that promise completes.
 * An optional conccurency level specifies how many promises are waited for
 * at any given time.
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
      var item = this._queue.pop();
      _this._logger.debug("Processing item with key: %s", this._key(item));
      vals.push(callback(item));
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
