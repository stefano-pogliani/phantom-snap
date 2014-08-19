var assert      = require("assert");
var Page        = require("../out/page");
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
    var page    = new Page("");
    var result  = undefined;

    fetcher.fetch(page).then(function(page_again) {
      assert(page === page_again);
      assert("Google", page.phantom_id);

    }).fail(function(ex) {
      // Intercept assert fails.
      result = ex;

    }).finally(function() {
      // Stop Phantom and complete test.
      fetcher.stop().then(function() {
        done(result);
      });
    });
  });

});
