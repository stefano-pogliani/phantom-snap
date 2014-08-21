define(function(require) {
  var socketio = require("socket.io");
  var socket   = null;


  /**
   * Handles an event received from the server.
   * @param {!String} event The event to handle.
   * @param {=Object} data  Optional data sent with the event.
   */
  var handleInEvent = function(event, identifier, data) {
    console.log("Received event '" + event + "' (id: " + identifier + ").");

    // Delay call because jumping to Phantom from an handler breaks emit ...
    setTimeout(function() {
      window.callPhantom({
        data:  data,
        id:    identifier,
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
      handleInEvent(event, null, data);
    });
  };

  /**
   * Registers an event for forwarding to Phantom.
   * @param {!String} event The event to forward.
   */
  var registerIdentifiedEvent = function(event) {
    socket.on(event, function(identifier, data) {
      handleInEvent(event, identifier, data);
    });
  };

  /** Connect to the server and start accepting requests from it. */
  var start = function() {
    socket        = socketio.connect();
    window.socket = socket;

    // Register known events from server.
    registerEvent("exit");
    registerIdentifiedEvent("close");
    registerIdentifiedEvent("connected");
    registerIdentifiedEvent("fetch");
    registerIdentifiedEvent("getContent");
    registerIdentifiedEvent("render");
  };

  return {
    start: start
  };
});
