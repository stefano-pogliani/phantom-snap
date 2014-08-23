var fs   = require("fs");
var path = require("path");
var Q    = require("q");

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
    base_url, base_path, queue, graph) {
  Base.call(this);
  this._base_url  = base_url;
  this._base_path = base_path;
  this._graph     = graph;
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
  var out_file = path.join(this._base_path, page.uri);

  return page.getContent().then(function(content) {
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
  });
};
