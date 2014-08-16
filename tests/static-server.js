var assert = require("assert");
var http   = require("http");
var path   = require("path");

var StaticServer = require("../out/static-server");


suite("StaticServer", function() {
  setup(function() {
    this.server = new StaticServer({
      logger: require("../out/silent-logger"),
      path:   path.join(__dirname, "fixtures"),
      port:   9000
    });
  });


  test("Serving", function(done) {
    var _this = this;
    this.server.start();

    var request = http.request({
      path: "/static.txt",
      port: 9000
    }, function(res) {
      var buffer = "";

      res.on("data", function(chunk) { buffer += chunk; });
      res.on("end", function() {
        _this.server.stop().then(function() {
          assert.equal("Served!", buffer);
          done();
        });
      });

    });

    request.on("error", function(e) { done(e); });
    request.end();
  });


  test("Stop without start", function(done) {
    this.server.stop().then(function() {
      done();
    });
  });
});
