var assert      = require("assert");
var PageFetcher = require("../out/page-fetcher");


suite("PageFetcher", function() {
  setup(function() {
    this.fetcher = new PageFetcher({
      base_url: "https://www.google.com",
      logger:   require("../out/silent-logger")
    });
  });


  test("Get Phantom", function(done) {
    var _this     = this;
    var instance1 = null;
    var instance2 = null;
    var result    = null;

    this.fetcher._getPhantom().then(function(phantom1) {
      instance1 = phantom1;
      return _this.fetcher._getPhantom().then(function(phantom2) {
        instance2 = phantom2;
        assert(phantom1 === phantom2);
      });
    }).fail(function(ex) {
      result = ex;
    }).finally(function() {
      var promise = null;

      if(instance1) { promise = instance1.stop(); }
      if (instance2 && instance1 !== instance2) {
        if (promise) {
          promise.then(function() {
            return instance2.stop();
          });
        }
      }

      if (promise) {
        promise.then(function() { done(result); });
      } else {
        done(new Error("No Phantom to stop."));
      }
    });
  });

  test("Fetch Google", function(done) {
    var fetcher = this.fetcher;
    var result  = undefined;

    fetcher.fetch("").then(function(page) {
      assert.equal("", page.uri);
      assert.equal("Google", page.title);

    }).fail(function(ex) {
      // Intercept assert fails.
      if (ex instanceof Error) {
        result = ex;
      } else {
        result = new Error(JSON.stringify(ex));
      }

    }).finally(function() {
      // Stop Phantom and complete test.
      return fetcher.stop().then(function() {
        done(result);
      });
    });
  });

});
