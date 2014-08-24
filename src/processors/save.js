var fs     = require("fs");
var path   = require("path");
var mkdirp = require("mkdirp");
var Q      = require("q");

var Base = require("./base");


/**
 * PageProcessor to crawl an entire website and save it as static pages.
 * 
 * @param {!String} base_url
 *   The base URL of each page.
 *   This includes things like the protocol, domain and port as well as
 *   initial portion of each URI.
 *   When using the StaticServer, this will look something like:
 *   http://localhost:9000/
 *
 * @param {!String}    base_path The root directory where snapshots are saved.
 * @param {!PageQueue} queue     A PageQueue instance to store newly discovered
 *                               pages.
 * @param {=PageGraph} graph     A PageGraph instance that traks the site map.
 */
var SaveProcessor = module.exports = function SaveProcessor(
    base_url, base_path, queue, graph, logger) {
  Base.call(this);
  this._base_url  = base_url || "http://localhost:8080/";
  this._base_path = base_path;
  this._graph     = graph;
  this._logger    = logger || require("../loggers/default");
  this._queue     = queue;
};
Base.extendConstructor(SaveProcessor);

/**
 * Extracts the content of the page and stores it into a file.
 * The name of the file is derived from the URI and the base path.
 * 
 * After the content is extracted, so are links.
 * Links to internal pages are added to the processing queue and, if available
 * the graph.
 * 
 * @param {!Page} page The Page instance to process.
 * @returns {!Q.Promise} A promise that resolves agter the page is processed.
 */
SaveProcessor.prototype.process = function(page) {
  // TODO: need to deal with # and #! in uri.
  //       for now it is possible to include it in the base URL.
  var _this    = this;
  var out_file = path.join(
      this._base_path, page.uri === "/" ? "index.html" : page.uri);
  var dir      = path.dirname(out_file);

  return page.getContent().then(function(content) {
    return Q.fcall(fs.exists, dir).then(function(exists) {
      if (!exists) {
        return Q.nfcall(mkdirp, dir);
      }

    }).then(function() {
      return content;
    });

  }).then(function(content) {
    // Write content to file.
    return Q.nfcall(fs.writeFile, out_file, content);

  }).then(function() {
    // Get links in page.
    return page.listLinks();
  }).then(function(links) {
    // Process links and enqueue them.
    for (var idx = 0; idx < links.length; idx++) {
      var link = links[idx];
      var uri  = link.href;
      if (uri.substring(0, _this._base_url.length) !== _this._base_url) {
        // Ignore cross-domain links.
        continue;
      }

      uri       = uri.substring(_this._base_url.length);
      link.href = uri;
      _this._queue.enqueue({
        uri:   uri,
        depth: page.depth + 1
      });

      if (_this._graph) {
        _this._graph.link(page.uri, link);
      }
    }
  }).fail(function(ex) {
    _this._logger.error("Processing page failed: %s.", ex.message);
    throw ex;
  });
};
