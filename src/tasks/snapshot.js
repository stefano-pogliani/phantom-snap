var CrawlingDriver = require("../drivers/crawler");


module.exports = function(grunt) {

  /**
   * Grunt task to take a snapshot of a website.
   * The options available depend on the driver in use.
   * Currently only the CrowlingDriver is implemented.
   */
  grunt.registerTask(
      "snapshot",
      "Takes snapshots of dinamic sites using PhantomJS.",
      function() {
    var done    = this.async();
    var options = this.options({
      vebose_logging: null
    });

    // Pre-process options as needed.
    if (options.verbose_logging !== null) {
      options.logger = require(
          options.verbose_logging ?
          "../loggers/verbose" :
          "../loggers/silent"
      );
    }

    // And we are off!!!
    var driver = new CrawlingDriver(options);
    driver.start().then(function() {
      done();
    });
  });

};
