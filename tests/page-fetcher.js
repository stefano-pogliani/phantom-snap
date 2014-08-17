var assert      = require("assert");
var Page        = require("../out/page");
var PageFetcher = require("../out/page-fetcher");


//suite("PageFetcher", function() {
//  setup(function() {
//    this.fetcher = new PageFetcher({});
//  });
//
//  test("Create Phantom", function(done) {
//    var phantom_instance = null;
//
//    this.fetcher._createPhantom().then(function(phantom) {
//      phantom_instance = phantom;
//      assert(phantom.createPage);
//      done();
//    }).fail(function(ex) {
//      done(ex);
//    }).finally(function() {
//      phantom_instance && phantom_instance.exit();
//    });
//  });
//
//  test("Get Phantom", function(done) {
//    var _this             = this;
//    var phantom_instance1 = null;
//    var phantom_instance2 = null;
//
//    this.fetcher._getPhantom().then(function(phantom1) {
//      phantom_instance1 = phantom1;
//      return _this.fetcher._getPhantom().then(function(phantom2) {
//        phantom_instance2 = phantom2;
//        assert(phantom1 === phantom2);
//        done();
//      });
//    }).fail(function(ex) {
//      done(ex);
//    }).finally(function() {
//      phantom_instance1 && phantom_instance1.exit();
//      if (phantom_instance2 && phantom_instance1 !== phantom_instance2) {
//        phantom_instance2.exit();
//      }
//    });
//  });
//  
//  test("Fetch page", function(done) {
//    this.fetcher.fetch(new Page("/")).then(function() {
//      //done();
//    }).fail(function(ex) {
//      done(ex);
//    });
//  });
//
//});
