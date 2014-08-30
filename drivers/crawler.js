var _ = require("underscore");

var PageFetcher   = require("../page-fetcher");
var PageQueue     = require("../page-queue");
var SaveProcessor = require("../processors/save");
var StaticServer  = require("../static-server");


/**
 * Driver that crawls a website strating from a given index and takes a
 * snapshot of it.
 * @class CrawlingDriver
 * 
 * @param {!Object} options
 *   An object with all options for the crawler and its dependencies.
 *   Options for all components are separated into sub-objects.
 *   Such options are stored in the `crawler`, `fetcher`, `queue` and `static`
 *   properties.
 * 
 *   A special `global` property stores settings that will be applied to
 *   all components.
 *   
 *   An example of the options parameter is:
 *   ```
 *   {
 *     global: {
 *       logger: require("phantom-snap/loggers/silent")
 *     },
 *     crawler: {
 *       index:     "index.html",
 *       base_path: "/tmp/phantom-snap/"
 *     },
 *     static: {
 *       path: "/home/dev/project/src"
 *     }
 *   }
 *   ```
 */
var CrawlingDriver = module.exports = function CrawlingDriver(options) {
  // Build sub-component options.
  var global_opts    = _.extend({}, options.global);
  var crawler_opts   = _.extend({}, global_opts, options.crawler);
  var fetcher_opts   = _.extend({}, global_opts, options.fetcher);
  var queue_opts     = _.extend({}, global_opts, options.queue);
  var static_opts    = _.extend({}, global_opts, options.static);
  var processor_opts = _.extend({}, global_opts, options.processor, {
    base_url:  fetcher_opts.base_url,
    base_path: crawler_opts.base_path,
    graph:     this._graph,
    logger:    global_opts.logger,
    queue:     this._queue
  });

  // Store options for later.
  this._index  = crawler_opts.index  || "index.html";
  this._logger = crawler_opts.logger || require("../loggers/default");
  queue_opts.key = function(item) { return item.uri; };

  // Create required objects.
  this._fetcher   = new PageFetcher(fetcher_opts);
  this._graph     = null;
  this._queue     = new PageQueue(queue_opts);
  this._server    = options.static ? new StaticServer(static_opts) : null;
  this._processor = new SaveProcessor(processor_opts);
};

/**
 * Internally called to process each item in the queue.
 * @param {!Object} resource An item from the queue.
 * @returns {!Q.Promise} A promise that resolves when the page is processed.
 */
CrawlingDriver.prototype._process = function(resource) {
  var processor = this._processor;
  return this._fetcher.fetch(resource.uri).then(function(page) {
    page.depth = resource.depth;
    return processor.process(page);
  });
};

/**
 * Starts crawling the website.
 * @returns {!Q.Promise} A promise that resolves when the site has been crawled.
 */
CrawlingDriver.prototype.start = function() {
  var server = this._server;
  if (server) {
    this._logger.debug("Crawler staring static server.");
    server.start();
  }

  this._logger.info("Starting to crawl form: %s", this._index);
  this._queue.enqueue({
    uri:   this._index,
    depth: 0
  });
  var promise = this._queue.process(this._process.bind(this));

  if (server) {
    var logger = this._logger;
    promise = promise.then(function() {
      logger.debug("Crawler stopping static server.");
      return server.stop().then(function() {
        logger.info("Crawler done.");
      });
    });
  }
  return promise;
};
