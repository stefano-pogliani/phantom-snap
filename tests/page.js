var assert = require("assert");
var Page   = require("../out/page");


suite("Page", function() {
  test("Constructor", function() {
    var page = new Page("a", 2);
    assert.equal("a", page.uri);
    assert.equal(2,   page.depth);
  });
});
