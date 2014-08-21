var assert = require("assert");
var path   = require("path");

var PageFetcher  = require("../out/page-fetcher");
var StaticServer = require("../out/static-server");


suite("PageFetcher", function() {
  setup(function() {
    var logger   = require("../out/silent-logger");
    this.fetcher = new PageFetcher({
      base_url: "http://localhost:9000",
      logger:   logger
    });

    this.server = new StaticServer({
      logger: logger,
      path:   path.join(__dirname, "fixtures"),
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

  test("Get Phantom", function(done) {
    var _this  = this;
    this.fetcher._getPhantom().then(function(phantom1) {
      return _this.fetcher._getPhantom().then(function(phantom2) {
        assert(phantom1 === phantom2);
        done();
      });
    }).fail(function(ex) {
      done(ex);
    });
  });

  test("Fetch Page", function(done) {
    var fetcher = this.fetcher;

    fetcher.fetch("/get-html.html").then(function(page) {
      assert.equal("/get-html.html", page.uri);
      assert.equal("TITLE", page.title);
      done();

    }).fail(function(ex) {
      // Intercept assert fails.
      if (ex instanceof Error) {
        done(ex);
      } else {
        done(new Error(JSON.stringify(ex)));
      }
    });
  });

});
