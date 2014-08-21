var child_process = require("child_process");
var express       = require("express");
var http          = require("http");
var path          = require("path");
var socketio      = require("socket.io");

var PhantomJS = require("phantomjs");
var Q         = require("q");

var Page = require("../page");


/**
 * Wrapper to send commands from Node to Phantom and get results back.
 * 
 * Every instance has an express.js server running and spawns a Phantom.js
 * process that connects to the express server.
 * Node and Phantom use socket.io to exchange messages and data.
 * 
 * @class Phantom
 */
var Phantom = module.exports = function(options) {
  options   = options || {};
  this.port = options.port || 8081;

  /**
   * The next free unique identifier for requests sent to Phantom.
   * @type {!Number}
   */
  this._request_id = 0;

  /**
   * A map from request id to promise.
   * Only pending requests are kept in this map.
   * @type {!Object}
   */
  this._requests = {};

  this._app     = express();
  this._logger  = options.logger || require("../default-logger");
  this._server  = http.createServer(this._app);
  this._io      = socketio.listen(this._server);

  this._clear   = null;
  this._pages   = [];
  this._process = null;
  this._ready   = null;
  this._socket  = null;

  // Build Phantom arguments list.
  this._args = [
    PhantomJS.path, path.join(__dirname, "driver.js"), this.port, "--debug"
  ];

  // Setup express and socket.io.
  this._app.use( "/", express.static(path.join(__dirname, "front")) );
  this._io.sockets.on("connection", this._handleSocketConnect.bind(this));
};


/** Cleans up uinternal state after the Phantom process terminates. */
Phantom.prototype._afterPhantomExits = function() {
  var clear = this._clear || { resolve: function() {} };

  this._logger.info("Stopping control server on port %d.", this.port);
  this._server.close(function() {
    clear.resolve();
  });
  
  // TODO: Iterate over pages in this._pages and clear phantom information.
  for (var idx = 0; idx < this._pages.length; idx++) {
    this._pages[idx].detachPhantom();
  }

  this._clear   = null;
  this._pages   = [];
  this._process = null;
  this._ready   = null;
};

/** Attaches the current instance to the process running Phantom. */
Phantom.prototype._attachToProcess = function(proc) {
  this._process = proc;
  proc.on("exit", this._handlePhantomExit.bind(this));
  proc.stderr.on("data", this._handleStdErrData.bind(this));
  proc.stdout.on("data", this._handleStdOutData.bind(this));
};

/**
 * Sends an event to Phantom and waits for a response.
 * 
 * @param {!String} event The event to emit.
 * @param {=Object} data  A data object to send with the event.
 * @returns {!Q.Promise} A promise that resolves when a reply to the event
 *                       is received.
 */
Phantom.prototype._emit = function(event, data) {
  var deferred   = Q.defer();
  var identifier = this._request_id++;
  this._requests[identifier] = deferred;
  this._socket.emit(event, identifier, data);
  this._logger.debug("Emitted event '%s' (id: %d).", event, identifier);
  return deferred.promise;
};

/**
 * Registers an identified event on the socket and resolves the promise
 * associated to the identifier.
 * 
 * @param {!Object} socket The socket to attach the listener to.
 * @param {!String} event  The event to listen for.
 */
Phantom.prototype._register = function(socket, event) {
  var _this = this;
  socket.on(event, function(id, data) {
    _this._logger.debug("Received event '%s'.", event);
    if (_this._requests[id]) {
      if (data && typeof data === "object" && data.__phantom_error) {
        _this._requests[id].reject(data.data, event);
        _this._logger.debug("Rejected event id: %d.", id);
      } else {
        _this._requests[id].resolve(data, event);
        _this._logger.debug("Resolved event id: %d.", id);
      }
      delete _this._requests[id];
    } else {
      this._logger.info("Ignored event '%s' with unknown id %d).", event, id);
    }
  });
};


/*** HANDLERS ***/
/**
 * Handles the connection of a client.
 * @param {!Object} socket The socket used to talk to the client.
 */
Phantom.prototype._handleSocketConnect = function(socket) {
  var _this    = this;
  this._socket = socket;

  // Register events so that their promises can be resolved.
  this._register(socket, "closed");
  this._register(socket, "fetched");
  this._register(socket, "gotContent");
  this._register(socket, "links");
  this._register(socket, "ready");
  this._register(socket, "rendered");
  this._register(socket, "report-error");

  // Emit "connected" to trigger Phantom setup.
  this._emit("connected").then(function() {
    _this._ready.resolve(_this);
  });
};

/**
 * Receives some data from Phantom's stderr.
 * @param {!String} chunck The data from stderr.
 */
Phantom.prototype._handleStdErrData = function(chunck) {
  this._logger.debug("PhantomJS reported and error: " + chunck);
};

/**
 * Receives some data from Phantom's stdout.
 * @param {!String} chunck The data from stdout.
 */
Phantom.prototype._handleStdOutData = function(chunck) {
  this._logger.debug("PhantomJS reported: " + chunck);
};

/**
 * Invoked when the Phantom process terminates.
 * @param {!Number} code The return code of Phantom.
 */
Phantom.prototype._handlePhantomExit = function(code) {
  if (code) {
    this._logger.info("PhantomJS terminated with a non-zero code: %d.", code);
  }
  this._afterPhantomExits();
};


/**
 * Requests to Phantom to fetch a new page.
 * 
 * @param {!String} host        The host where the resource is located.
 * @param {!String} uri         The identifier of the resource on the host.
 * @param {!String} waiter_path The path to the Phantom module that defines the
 *                              LoadWaiter to use with this page.
 * @returns {!Q.Promise} A promise that resolves to the loaded page.
 */
Phantom.prototype.fetch = function(host, uri, waiter_path) {
  var _this = this;
  return this._emit("fetch", {
    url:         host + uri,
    waiter_path: waiter_path
  }).then(function(page_info) {
    var page = new Page(_this, uri);
    page._phantom_id = page_info.id;
    page.title       = page_info.title;
    _this._pages.push(page);
    return page;
  });
};

/**
 * Closes a page.
 * @param {!Number} page_id The identifier of the page to close.
 * @returns {Q.Promise} A promise that resolves when the page is closed.
 */
Phantom.prototype.close = function(page_id) {
  var _this = this;
  return this._emit("close", page_id).then(function() {
    var page_index = _this._pages.indexOf(page_id);
    _this._pages.splice(page_index, 1);
  });
};

/**
 * Gets the content for a page.
 * @param {!Number} page_id The identifier of the page to get content for.
 * @returns {Q.Promise} A promise that resolves with the content.
 */
Phantom.prototype.getContentFor = function(page_id) {
  return this._emit("getContent", page_id);
};

/**
 * @returns {!Boolean} True if Phantom is ready and running.
 */
Phantom.prototype.isRunning = function() {
  return !!(this._process || this._clear);
};

/**
 * Lists all the links in a page.
 * @param {!Number} page_id The identifier of the page to list links for.
 * @returns {Q.Promise} A promise that resolves to a list of links.
 */
Phantom.prototype.listLinksFor = function(page_id) {
  return this._emit("listLinks", page_id);
};

/**
 * Renders a page.
 * @param {!Number} page_id  The identifier of the page to render.
 * @param {!String} filename The absolute path to the file to render to.
 * @returns {Q.Promise} A promise that resolves when the render is complete.
 */
Phantom.prototype.render = function(page_id, filename) {
  return this._emit("render", {
    filename: filename,
    id:       page_id
  });
};

/**
 * Starts the control server and spawns the Phantom process.
 * @returns {!Q.Promise} A promise that resolves when Phantom is ready.
 */
Phantom.prototype.spawn = function() {
  // Prevent multiple spawns.
  if (this._ready) { return this._ready.promise; }

  var args    = this._args.join(" ");
  this._ready = Q.defer();

  this._logger.info("Starting PhantomJS control server on port %d.", this.port);
  this._server.listen(this.port);

  this._logger.info("Starting PhantomJS instance.");
  this._attachToProcess(child_process.exec(args, {
    cwd: __dirname
  }));
  return this._ready.promise;
};

/**
 * Terminates the Phantom process and stops the control server.
 * @returns {!Q.Promise} A promise that resolves when the control server 
 *                       is terminated.
 */
Phantom.prototype.stop = function() {
  var clear = this._clear = Q.defer();

  if (this._socket) {
    this._socket.emit("exit");

  } else {
    // Assume server is running and try to stop.
    // If it was not ignore the error.
    try {
      this._server.close(function() {
        clear.resolve();
      });
    } catch(ex) {
      clear.resolve();
    }
  }
  return this._clear.promise;
};
