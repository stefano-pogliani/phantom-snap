var assert  = require("assert");
var Phantom = require("../../out/phantomjs/wrapper");


suite("PhantomJS Wrapper", function() {
  setup(function() {
    this.phantom = new Phantom({
      logger: require("../../out/silent-logger")
    });
  });

  test("failing fetch", function(done) {
    var phantom = this.phantom;
    var result  = undefined;

    phantom.spawn().then(function() {
      return phantom.fetch("non-existent-url");

    }).then(function() {
      // Verify Phantom fails.
      result = new Error("Page fetch did not fail.");

    }).fail(function(status) {
      // Verify expected result.
      assert.equal("fail", status);

    }).fail(function(ex) {
      // Intercept assert failures.
      result = ex;

    }).finally(function() {
      // Stop Phantom test and resolve test.
      phantom.stop().then(function() {
        done(result);
      });
    });
  });

  test("fetch", function(done) {
    var phantom = this.phantom;
    var result  = undefined;

    phantom.spawn().then(function() {
      return phantom.fetch("https://www.google.com");

    }).then(function(info) {
      // Verify results.
      assert.equal("Google", info.title);
      assert(typeof info.id === "number");

    }).fail(function(ex) {
      // Intercept assert failures.
      result = ex;

    }).finally(function() {
      // Stop Phantom test and resolve test.
      phantom.stop().then(function() {
        done(result);
      });
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
