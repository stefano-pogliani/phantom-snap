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

  test("List links", function(done) {
    this.fetcher.fetch("links.html").then(function(page) {
      return page.listLinks();
    }).then(function(links) {
      assert.equal(2, links.length);
      assert(typeof links[0] === "object");
      assert(typeof links[1] === "object");

      // Check data
      assert.equal("Internal", links[0].title);
      assert.equal("Google",   links[1].title);
      assert.equal("http://localhost:9000/internal", links[0].href);
      assert.equal("https://www.google.com/",        links[1].href);

      done();

    }).fail(function(ex) {
      done(ex);
    });
  });

  test("Render", function(done) {
    this.fetcher.fetch("get-html.html").then(function(page) {
      return page.render("./tests/render-result.png");
    }).then(function() {
      assert.equal(
          fs.readFileSync(
              "./tests/fixtures/expected-render.png", { encoding: "utf8" }),
          fs.readFileSync("./tests/render-result.png", { encoding: "utf8" })
      );
      done();
    }).fail(function(ex) {
      done(ex);
    });
  });
});
