var PageFetcher   = require("../page-fetcher");
var PageQueue     = require("../page-queue");
var SaveProcessor = require("../processors/save");
var StaticServer  = require("../static-server");


// ?
var CrawlerDriver = module.exports = function CrawlerDriver(options) {
  this._logger = options.logger || require("../logger/default");
  // Build sub-component options.

  // Create required objects.
  this._fetcher = new PageFetcher(options.fetcher);
  this._graph   = null;
  this._queue   = new PageQueue(options.queue);
  this._server  = options.static ? new StaticServer(options.static) : null;
  this._processor = new SaveProcessor(
      options.fetcher.base_url, options.base_path, this._queue, this._graph);
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
  this._queue.enqueue({
    uri:   "",
    depth: 0
  });

  server.start();
  return this._queue.process(this._process.bind(this)).then(function() {
    return server.stop();
  });
};
