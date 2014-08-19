module.exports = function(control_page, data, event_id) {
  control_page.evaluate(function(event_id) {
    alert("Emit ready: " + event_id);
    socket.emit("ready", event_id);
  }, event_id);
};
