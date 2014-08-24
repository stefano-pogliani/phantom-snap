var assert = require("assert");
var path   = require("path");

var Phantom      = require("../../../out/phantomjs/wrapper");
var StaticServer = require("../../../out/static-server");


suite("Css Polling LoadWaiter", function() {
  setup(function() {
    var logger   = require("../../../out/loggers/silent");
    this.phantom = new Phantom({
      logger: logger
    });

    this.server = new StaticServer({
      logger: logger,
      path:   path.join(__dirname, "..", "..", "fixtures"),
      port:   9000
    });
    this.server.start();
  });

  teardown(function(done) {
    var server = this.server;
    this.phantom.stop().then(function() {
      return server.stop();
    }).finally(function() {
      done();
    });
  });

  test("wait", function(done) {
    var phantom = this.phantom;
    phantom.spawn().then(function() {
      return phantom.fetch("http://localhost:9000/", "waiters/index.html", {
        path:     "./waiters/css-polling",
        property: "display",
        selector: "#wait-target",
        value:    "none"
      });

    }).then(function(page) {
      assert.equal(page.title, "Done waiting.");
      done();

    }).fail(function(ex) {
      done(ex);
    });
  });
});
