var source_re = new RegExp("out");
var module_re = new RegExp("node_modules");


require("blanket")({
  pattern: function(filename) {
    return (source_re.test(filename) && !module_re.test(filename));
  }
});
