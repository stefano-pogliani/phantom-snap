require.config({
  paths: {
    "socket.io": "libs/socket.io.browser"
  },

  // Start the app:
  deps:     ["client"],
  callback: function (client) { client.start(); }
});
