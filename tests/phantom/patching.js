var assert = require("assert");
var path   = require("path");

var PageFetcher  = require("../../out/page-fetcher");
var StaticServer = require("../../out/static-server");


suite("Phantom page patches", function() {
  setup(function() {
    var logger   = require("../../out/loggers/silent");
    this.fetcher = new PageFetcher({
      base_url:       "http://localhost:9000",
      logger:         logger,
      waiter_options: {
        path:     "./waiters/css-polling",
        property: "display",
        selector: "#ready",
        value:    "none"
      }
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

  test("Function.prototype.bind", function(done) {
    this.fetcher.fetch("/patches/bind.html").then(function(page) {
      assert.equal("Changed!", page.title);
      done();

    }).fail(function(ex) {
      // Intercept assert fails.
      done(ex);
    });
  });

});
