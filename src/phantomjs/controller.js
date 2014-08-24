var system  = require("system");
var webpage = require("webpage");


/**
 * Phantom side controller that comunicates with Node.
 * @class Controller
 * 
 * @param {!Number}  port  The port the server is listening on.
 * @param {!Boolean} debug Enable debug mode, which prints status messages to
 *                         stdout.
 */
var Controller = module.exports = function(port, debug) {
  var _this     = this;
  this._debug   = debug;
  this._port    = port;
  this._page_id = 0;
  this._pages   = {};

  this._control_page            = this.createPage();
  this._control_page.onCallback = function() {
    _this._handleFromPage.apply(_this, arguments);
  };
};

/**
 * Invoked when control_page receives an event from the server.
 * @param {!Object} event Information about the received event.
 */
Controller.prototype._handleFromPage = function(event_data) {
  var data    = event_data.data;
  var event   = event_data.event;
  var id      = event_data.id;
  var handler = this._events[event];

  if (handler) {
    try {
      handler.call(this, data, id);
      this._log("Handled event '" + event + "' (id: " + id + ").");
    } catch(err) {
      this._log("Error handling event '" + event + "' (id: " + id + ").");
      this._log(err.stack);
      this.emitFail(id, {
        message: err.message,
        trace:   err.stack,
        type:    "exception"
      });
    }
  } else {
    this.emitFail(id, "Could not handle unkown event '" + event + "'");
  }
};

/**
 * Outputs the message if debug mode is enabled.
 * @param {!String} msg The message to output.
 */
Controller.prototype._log = function(msg) {
  if (this._debug) {
    system.stdout.write(msg);
  }
};

/** Creates a connection to the controller server. */
Controller.prototype.connect = function() {
  this._control_page.open(
      "http://127.0.0.1:" + this._port + "/", function(status) {
    if (status !== "success") {
      system.stderr.write("Unable to connect to control page.");
      phantom.exit(1);
    }
  });
};

/**
 * Creates a new Phantom page.
 * @returns {!Object} A new Phantom page.
 */
Controller.prototype.createPage = function() {
  var page = webpage.create();
  page.settings.userAgent = "PhantomSnap";

  if (this._debug) {
    page.onConsoleMessage = function(msg) {
      system.stdout.write(msg);
    };
  }

  return page;
};

/**
 * Sends a message to Node.
 * @param {!String} event The event to send.
 * @param {Number}  id    The identifier of the message this is a response to.
 * @param {=Object} data  The data to attach to the event.
 */
Controller.prototype.emit = function(event, id, data) {
  this.evaluate(function(event, id, data) {
    console.log("Emitting event '" + event + "' (id: " + id + ").");
    socket.emit(event, id, data);
  }, event, id, data);
};

/**
 * Sends an error message to the controller.
 * @param {!Number} id   The identifier of the message being handled when the
 *                       failure occurs.
 * @param {!Object} data The data to send along the message.
 */
Controller.prototype.emitFail = function(id, data) {
  this.emit("report-error", id, {
    __phantom_error: true,
    data:            data
  });
};

/**
 * Shorthand to call evaluate on the control page.
 * @param {...Object} var_args The arguments to pass to control_page.evaluate.
 */
Controller.prototype.evaluate = function(var_args) {
  return this._control_page.evaluate.apply(this._control_page, arguments);
};


/*** Events Handlers ***/
Controller.prototype._events = {};

/**
 * Closes a page.
 * @param {!Number} page_id  The identifier of the page to close.
 * @param {!Number} event_id The identifier of the event requesting the close.
 */
Controller.prototype._events.close = function(page_id, event_id) {
  var page = this._pages[page_id];
  if (!page) {
    this.emitFail(
        event_id, "Invalid page identifier '" + page_id + "' for close.");
    return;
  }
  page.close();
  delete this._pages[page_id];
  this.emit("closed", event_id);
};

/** The control server is ready to deal with me. */
Controller.prototype._events.connected = function(data, event_id) {
  this.emit("ready", event_id);
};

/** The control server requestes me to exit. */
Controller.prototype._events.exit = function() {
  phantom.exit();
};

/**
 * The control server wants me to load a new page.
 * 
 * @param {String} url      The url of the page to fetch.
 * @param {Number} event_id The unique id of the request event.
 */
Controller.prototype._events.fetch = function(data, event_id) {
  var controller = this;
  var page       = this.createPage();

  page.open(data.url, function(status) {
    controller._log("Page open succeeded: " + status);
    if (status !== "success") {
      controller.emitFail(event_id, status);
      return;
    }

    try {

      var page_id    = controller._page_id++;
      var waiter_ops = data.waiter_options;
      var waiter     = require(waiter_ops.path)(waiter_ops);
      controller._pages[page_id] = page;

      // Wait for page to (really) load.
      waiter.wait(page, function() {
        controller.emit("fetched", event_id, {
          id:    page_id,
          title: page.title
        });
      });

    } catch(err) {
      controller._log("Error waiting for page '" + data.url + "'.");
      controller._log(err.stack);
      controller.emitFail(event_id, {
        message: err.message,
        trace:   err.stack,
        type:    "exception"
      });
    }
  });
};

/**
 * Gets the HTML content for a page.
 * @param {!Number} page_id  The id of the page to get content for.
 * @param {!Number} event_id The id of the requesting event.
 */
Controller.prototype._events.getContent = function(page_id, event_id) {
  var page = this._pages[page_id];
  if (!page) {
    this.emitFail(
        event_id, "Invalid page identifier '" + page_id + "' for getContent.");
    return;
  }
  this.emit("gotContent", event_id, page.content);
};

/**
 * Lists all the links in a page.
 * @param {!Number} page_id  The id of the page to list links for.
 * @param {!Number} event_id The id of the requesting event.
 */
Controller.prototype._events.listLinks = function(page_id, event_id) {
  var page  = this._pages[page_id];
  if (!page) {
    this.emitFail(
        event_id, "Invalid page identifier '" + page_id + "' for listLinks.");
    return;
  }

  var links = page.evaluate(function() {
    var links = [];
    var tags  = document.getElementsByTagName("a");

    for (var idx = 0; idx < tags.length; idx++) {
      links.push({
        href:  tags[idx].href,
        title: tags[idx].text
      });
    }
    return links;
  });

  this.emit("links", event_id, links);
};

/**
 * Renders a page into a file.
 * @param {!Object} data     The parameters for the render request.
 * @param {!Number} event_id The id of the requesting event.
 */
Controller.prototype._events.render = function(data, event_id) {
  var filename = data.filename;
  var page_id  = data.id;
  var page     = this._pages[page_id];

  if (!page) {
    this.emitFail(
        event_id, "Invalid page identifier '" + page_id + "' for render.");
    return;
  }

  page.render(filename);
  this.emit("rendered", event_id);
};


/*** Debug events Handlers ***/
Controller.prototype._debug_events = {};


/**
 * Handes a debug event.
 * A debug event is essentially an event wrapped in an event of type "debug".
 * This allows events and debug events not to collide with each other.
 * 
 * @param {!Object} data     The parameters for the debug event.
 * @param {!Number} event_id The id of the requesting event.
 */
Controller.prototype._events.debug = function(data, event_id) {
  var event   = data.event;
  var handler = this._debug_events[event];

  if (handler) {
    try {
      handler.call(this, data, event_id);
      this._log("Handled debug event '" + event + "' (id: " + event_id + ").");
    } catch(err) {
      this._log(
          "Error handling debug event '" + event + "' (id: " + event_id + ").");
      this._log(err.stack);
      this.emitFail(event_id, {
        message: err.message,
        trace:   err.stack,
        type:    "exception"
      });
    }
  } else {
    this.emitFail(
        event_id, "Could not handle unkown debug event '" + event + "'");
  }
};

/**
 * Throws a generic exception with the given message.
 * @param {!Object} data The parameters for the exception.
 */
Controller.prototype._debug_events.exception = function(data) {
  throw new Error(data.message);
};
