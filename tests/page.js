var assert = require("assert");
var fs     = require("fs");
var path   = require("path");

var Page         = require("../out/page");
var PageFetcher  = require("../out/page-fetcher");
var StaticServer = require("../out/static-server");


suite("Page", function() {
  test("Constructor", function() {
    var page = new Page({}, "a", 2);
    assert.equal("a", page.uri);
    assert.equal(2,   page.depth);
  });

  test("Phantom detach", function(done) {
    // Prepare.
    var logger   = require("../out/silent-logger");
    var fetcher = new PageFetcher({
      base_url: "http://localhost:9000/",
      logger:   logger
    });
    var server = new StaticServer({
      logger: logger,
      path:   path.join(__dirname, "fixtures"),
      port:   9000
    });
    server.start();

    // Act.
    fetcher.fetch("get-html.html").then(function(page) {
      return fetcher.stop().then(function() {
        return server.stop();
      }).then(function() {
        return page;
      });

    }).then(function(page) {
      // Verify.
      assert.equal(page._phantom, null);
      assert.equal(page._phantom_id, null);
      return page._verifyPhantom().fail(function() {
        done();
      });

    }).fail(function(ex) {
      // Ensure no exception escapes.
      done(ex);
    });
  });
});

suite("Advanced page tests", function() {
  setup(function() {
    var logger   = require("../out/silent-logger");
    //var logger   = null;
    this.fetcher = new PageFetcher({
      base_url: "http://localhost:9000/",
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

  test("Close", function(done) {
    this.fetcher.fetch("get-html.html").then(function(page) {
      return page.close().then(function() {
        return page;
      });
    }).then(function(page) {
      assert.equal(page._phantom, null);
      assert.equal(page._phantom_id, null);
      done();
    }).fail(function(ex) {
      done(ex);
    });
  });

  test("Get HTML", function(done) {
    this.fetcher.fetch("get-html.html").then(function(page) {
      return page.getContent();
    }).then(function(content) {
      assert.equal(fs.readFileSync(
          "./tests/fixtures/get-html-res.html", { encoding: "utf8" }
      ), content);
      done();
    }).fail(function(ex) {
      done(ex);
    });
  });
});
