module.exports = function(control_page) {
  control_page.evaluate(function() {
    socket.emit("ready");
  });
};
