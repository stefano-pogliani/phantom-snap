var assert  = require("assert");
var Phantom = require("../../out/phantomjs/wrapper");


suite("PhantomJS Wrapper", function() {
  setup(function() {
    this.phantom = new Phantom({
      logger: require("../../out/silent-logger")
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
