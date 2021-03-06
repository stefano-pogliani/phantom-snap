var child_process = require("child_process");
var path          = require("path");
var Q             = require("q");

var Phantom = require("./phantomjs/wrapper");


/**
 * @class PageFetcher
 * Object that deals with fetching pages from the server.
 * 
 * @param {!Object} options
 *   Options to customise the behaviour of the fetcher.
 *   Available options are:
 *     * base_url: The base URL of the pages, should include trailing `/`.
 *     * logger: Object used for logging.
 *     * phantom_port: The port for the Phantom server to listent to.
 *     * waiter_options:
 *         Options for the LoadWaiter.
 *         The path of the module to load the waiter from is in the path
 *         attribute of this option objects.
 */
var PageFetcher = module.exports = function(options) {
  this._base           = options.base_url       || "http://localhost:8080/";
  this._waiter_options = options.waiter_options || { path: "./waiters/noop" };
  this._phantom     = new Phantom({
    logger: options.logger,
    port:   options.phantom_port
  });
};


/**
 * Gets an available Phantom instance, starting it if needed.
 * @returns {!Q.Promise} A promise that resolves to the Phantom instance.
 */
PageFetcher.prototype._getPhantom = function() {
  if (this._phantom.isRunning()) {
    var deferred = Q.defer();
    deferred.resolve(this._phantom);
    return deferred.promise;
  } else {
    return this._phantom.spawn();
  }
};


/**
 * Fetches a page.
 * @param {!String} uri The URI of the page to fetch.
 * @returns {!Object} A Q promise that resolves to the page when ready.
 */
PageFetcher.prototype.fetch = function(uri) {
  var _this = this;
  return this._getPhantom().then(function(phantom) {
    return phantom.fetch(_this._base, uri, _this._waiter_options);
  });
};

/**
 * Stops the Phantom instance attached to this fetcher.
 * @returns {!Q.Promise} A promise that resolves when Phantom has stopped.
 */
PageFetcher.prototype.stop = function() {
  return this._phantom.stop();
};
