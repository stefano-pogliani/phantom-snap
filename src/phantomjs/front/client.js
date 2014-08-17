define(function(require) {
  var socketio = require("socket.io");
  var socket   = null;


  /**
   * Handles an event received from the server.
   * @param {!String} event The event to handle.
   * @param {=Object} data  Optional data sent with the event.
   */
  var handleInEvent = function(event, data) {
    // Delay call because jumping to Phantom from an handler breaks emit ...
    setTimeout(function() {
      window.callPhantom({
        data:  data,
        event: event
      });
    }, 10);
  };

  /**
   * Registers an event for forwarding to Phantom.
   * @param {!String} event The event to forward.
   */
  var registerEvent = function(event) {
    socket.on(event, function(data) {
      handleInEvent(event, data);
    });
  };

  /** Connect to the server and start accepting requests from it. */
  var start = function() {
    socket        = socketio.connect();
    window.socket = socket;

    // Register known events from server.
    registerEvent("connected");
    registerEvent("exit");
  };

  return {
    start: start
  };
});
