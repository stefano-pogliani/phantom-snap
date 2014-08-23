var assert = require("assert");
var Base   = require("../../out/page-processors/base");

var Demo = function Demo() {
  Base.call(this);
};
Base.extendConstructor(Demo);


suite("Processors > Base", function() {
  test("check abstract", function() {
    assert.throws(function() {
      var base = new Base();
    }, Error);
  });

  test("check instance", function() {
    var demo = new Demo();
    assert(demo instanceof Demo);
    assert(demo instanceof Base);
    assert.equal(demo.process, Base.prototype.process);
  });
});
