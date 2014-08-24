var assert  = require("assert");
var Phantom = require("../../out/phantomjs/wrapper");


suite("PhantomJS Wrapper", function() {
  setup(function() {
    this.phantom = new Phantom({
      logger: require("../../out/loggers/silent")
    });
  });

  test("spawn", function(done) {
    var phantom = this.phantom;
    phantom.spawn().then(function() {
      phantom.stop().then(function() {
        done();
      });
    });
  });

  test("stop without running", function(done) {
    var phantom = this.phantom;
    phantom.stop().then(function() {
      done();
    }).fail(function(ex) {
      done(ex);
    });
  });
});


suite("PhantomJS Wrapper > pre-spawn", function() {
  setup(function(done) {
    this.phantom = new Phantom({
      logger: require("../../out/loggers/silent")
    });

    this.phantom.spawn().then(function() {
      done();
    }).fail(function(ex) {
      done(ex);
    });
  });

  teardown(function(done) {
    this.phantom.stop().then(function() {
      done();
    }).fail(function(ex) {
      done(ex);
    });
  });

  test("exception", function(done) {
    this.phantom.emit("debug", {
      event:   "exception",
      message: "Intentional exception."

    }).then(function() {
      done(new Error("debug.exception did not fail."));

    }).fail(function(ex) {
      assert(ex instanceof Error);
      assert.equal(ex.message, "Intentional exception.");
      done();

    }).fail(function(ex) {
      // Intercept assert failures.
      done(ex);
    });
  });

  test("failing fetch", function(done) {
    this.timeout(4000);
    this.phantom.fetch("non-existent-url", "").then(function() {
      // Verify Phantom fails.
      throw new Error("Page fetch did not fail.");

    }).fail(function(err) {
      // Verify expected result.
      if (typeof err !== "string") {
        throw err;
      }
      assert.equal("fail", err);
      done();

    }).fail(function(ex) {
      // Intercept assert failures.
      done(ex);
    });
  });

  test("fetch", function(done) {
    this.timeout(4000);
    this.phantom.fetch("https://www.google.com", "", {
      path: "./waiters/noop"
    }).then(function(page) {
      // Verify results.
      assert.equal("Google", page.title);
      assert(typeof page._phantom_id === "number");
      assert(page.phantom !== null);
      done();

    }).fail(function(ex) {
      // Intercept assert failures.
      done(ex);
    });
  });
});
