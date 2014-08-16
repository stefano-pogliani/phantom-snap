var express = require("express");
var Q       = require("q");


/**
 * An HTTP server to serve static files.
 * @class StaticServer
 * @param {!Object} options
 *   An object with options to cusomise the behaviour of the server.
 *   Options are:
 *     * logger: An object implementing the logger interface.
 *     * path (required): The path to the static files to serve.
 *     * port: The port for the server to listen on (default: 8080).
 *     
 */
var StaticServer = module.exports = function(options) {
  this.app    = express();
  this.logger = options.logger || require("./default-logger");
  this.path   = options.path;
  this.port   = options.port || 8080;
  this.server = null;
  this.app.use("/", express.static(this.path));
};

/** Starts serving the static files. */
StaticServer.prototype.start = function() {
  this.logger.info("Starting HTTP server for static files.");
  this.logger.debug("Serving '" + this.path + "' on port " + this.port + ".");
  this.server = this.app.listen(this.port);
};

/** Stops serving the static files. */
StaticServer.prototype.stop = function() {
  var deferred = Q.defer();

  if (this.server) {
    this.logger.info("Stopping HTTP server for static files.");
    this.server.close(deferred.resolve.bind(deferred));
  } else {
    deferred.resolve();
  }

  return deferred.promise;
};
