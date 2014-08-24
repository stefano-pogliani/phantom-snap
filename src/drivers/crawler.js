var _ = require("underscore");

var PageFetcher   = require("../page-fetcher");
var PageQueue     = require("../page-queue");
var SaveProcessor = require("../processors/save");
var StaticServer  = require("../static-server");


// ?
var CrawlerDriver = module.exports = function CrawlerDriver(options) {
  var global_opts = _.extend({}, options.global);

  this._index  = global_opts.index  || "/";
  this._logger = global_opts.logger || require("../loggers/default");

  // Build sub-component options.
  var fetcher_opts = _.extend({}, global_opts, options.fetcher);
  var queue_opts   = _.extend({}, global_opts, options.queue);
  var static_opts  = _.extend({}, global_opts, options.static);

  // Create required objects.
  this._fetcher = new PageFetcher(fetcher_opts);
  this._graph   = null;
  this._queue   = new PageQueue(queue_opts);
  this._server  = options.static ? new StaticServer(static_opts) : null;
  this._processor = new SaveProcessor(
      fetcher_opts.base_url, global_opts.base_path, this._queue, this._graph);
};

// ?
CrawlerDriver.prototype._process = function(resource) {
  var processor = this._processor;
  return this._fetcher.fetch(resource.uri).then(function(page) {
    page.depth = resource.depth;
    return processor.process(page);
  });
};

// ?
CrawlerDriver.prototype.start = function() {
  var server = this._server;
  if (server) {
    this._logger.debug("Crawler staring static server.");
    server.start();
  }

  this._logger.info("Starting to crawl form: /");
  this._queue.enqueue({
    uri:   this._index,
    depth: 0
  });
  var promise = this._queue.process(this._process.bind(this));

  if (server) {
    var logger = this._logger;
    promise = promise.then(function() {
      logger.debug("Crawler stopping static server.");
      return server.stop();
    });
  }
  return promise;
};
