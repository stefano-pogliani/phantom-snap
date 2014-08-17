module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    clean: {
      out: ["out"]
    },

    copy: {
      sources: {
        expand: true,
        cwd:    "src/",
        src:    ["**"],
        dest:   "out"
      }
    },

    jshint: {
      options: {
        curly:    true,
        eqeqeq:   true,
        freeze:   true,
        immed:    true,
        indent:   2,
        latedef:  true,
        newcap:   true,
        noarg:    true,
        noempty:  true,
        nonbsp:   true,
        nonew:    true,
        quotmark: true,
        //undef:    true,  // Find out how to register globals firts.
        trailing: true,
        maxlen:   80
      },
      all: [
        "src/**/*.js",
        "!src/**/libs/**",
        "!src/node_modules/**"
      ]
    },

    mochaTest: {
      options: {
        "check-leaks":     true,
        clearRequireCache: true,
        colors:            true,
        ui:                "tdd"
      },
      run: {
        options: { reporter: "spec" },
        src: [
          "tests/**/*.js",
          "!tests/cov-setup.js"
        ]
      },
      coverage: {
        options: {
          captureFile: "coverage.html",
          quiet:       true,
          reporter:    "html-cov",
          require:     "tests/cov-setup.js"
        },
        src: [
          "tests/**/*.js",
          "!tests/cov-setup.js"
        ]
      }
    },

    "npm-install": {}
  });

  // Plugins.
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadTasks("build/tasks");

  // Tasks
  grunt.registerTask("devel", [
    "clean:out", "jshint", "copy"
  ]);
  //grunt.registerTask("release", [
  //  "clean:out", "jshint", "copy", "less:release"
  //]);
  grunt.registerTask("test", ["devel", "npm-install", "mochaTest"]);

  //grunt.registerTask("default", "release");

};
