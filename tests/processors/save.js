var assert = require("assert");
var fs     = require("fs");
var path   = require("path");

var PageFetcher  = require("../../out/page-fetcher");
var Save         = require("../../out/processors/save");
var StaticServer = require("../../out/static-server");


var MockGraph = function() {
  this.edges = [];
  this.link  = function(uri, link) {
    this.edges.push({
      uri:  uri,
      link: link
    });
  };
};

var MockQueue = function() {
  this.queue   = [];
  this.enqueue = this.queue.push.bind(this.queue);
};


suite("Processors > Save", function() {
  setup(function() {
    //var logger     = null;
    var logger     = require("../../out/loggers/silent");
    this._base_url = "http://localhost:9000/";

    this.fetcher = new PageFetcher({
      base_url: this._base_url,
      logger:   logger
    });
    this.server = new StaticServer({
      logger: logger,
      path:   path.join(__dirname, "..", "fixtures"),
      port:   9000
    });
    this.server.start();
  });

  teardown(function(done) {
    var _this = this;
    this.fetcher.stop().then(function() {
      return _this.server.stop();
    }).finally(function() {
      done();
    });
  });

  test("process", function(done) {
    var graph     = new MockGraph();
    var queue     = new MockQueue();
    var processor = new Save(this._base_url, __dirname, queue, graph);
    this.fetcher.fetch("links.html").then(function(page) {
      return processor.process(page);
    }).then(function() {

      // Assert file.
      var encoding = { encoding: "utf8" };
      assert.equal(
          fs.readFileSync(path.join(__dirname, "links.html"), encoding),
          fs.readFileSync("./tests/fixtures/links-res.html", encoding)
      );
      fs.unlinkSync(path.join(__dirname, "links.html"));

      // Assert elements in queue.
      assert.deepEqual(queue.queue, [{
        uri:   "internal",
        depth: 1
      }]);

      // Assert graph updated.
      assert.deepEqual(graph.edges, [{
        uri:  "links.html",
        link: {
          href:  "internal",
          title: "Internal"
        }
      }]);
      done();

    }).fail(function(ex) {
      done(ex);
    });
  });

  test("nested paths", function(done) {
    var graph     = new MockGraph();
    var queue     = new MockQueue();
    var processor = new Save(this._base_url, __dirname, queue, graph);
    this.fetcher.fetch("nested/get-html.html").then(function(page) {
      return processor.process(page);
    }).then(function() {

      // Assert file.
      var encoding = { encoding: "utf8" };
      assert.equal(
          fs.readFileSync(path.join(__dirname, "nested", "get-html.html"),
                          encoding),
          fs.readFileSync("./tests/fixtures/get-html-res.html", encoding)
      );

      // Delete saved file and its directory.
      fs.unlinkSync(path.join(__dirname, "nested", "get-html.html"));
      fs.rmdirSync(path.join(__dirname, "nested"));

      done();
    }).fail(function(ex) {
      done(ex);
    });
  });
});
