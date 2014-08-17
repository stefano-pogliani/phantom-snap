var child_process = require("child_process");
var path          = require("path");
var Q             = require("q");


/**
 * @class PageFetcher
 * Object that deals with fetching pages from the server.
 * 
 * @param {!Object} options
 *   Options to customise the behaviour of the fetcher.
 *   Available options are:
 *     * base_url: The base URL of the pages, should include trailing `/`.
 *     * phantom_port: The port for the Phantom server to listent to.
 */
var PageFetcher = module.exports = function(options) {
  this._phantom = null;
  this.base     = options.base_url || "http://localhost:8080/";
  this.port     = options.port     || 8081;
};


/**
 * Creates a new instance of PhantomJS.
 * @returns {!Q.Promise} A promise that resolves to the Phantom instance.
 */
PageFetcher.prototype._createPhantom = function() {
  var deferred = Q.defer();
  return deferred.promise;
};

/**
 * Gets an available Phantom instance.
 * @returns {!Q.Promise} A promise that resolves to the Phantom instance.
 */
PageFetcher.prototype._getPhantom = function() {
  if (this._phantom) {
    var deferred = Q.defer();
    deferred.resolve(this._phantom);
    return deferred.promise;
  } else {
    return this._createPhantom();
  }
};


/**
 * Fetches a page.
 * @param {!Page} page A page instance wrapping the URI to fetch.
 * @returns {!Object} A Q promise that resolves to the page when ready.
 */
PageFetcher.prototype.fetch = function(page) {
  return this._getPhantom().then(function(phantom) {
    phantom.createPage(function() {
      console.log(arguments);
    });
  }).then(function(page) {
    //change user agent: "PhantomSnap"
    console.log(page);
  });
};
