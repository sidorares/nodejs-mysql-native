/* source: https://github.com/felixge/node-mysql/blob/d91edc4a6e5838285e8debd4e1d82a1cfe163074/lib/Pool.js */
var Mysql = require('mysql-native');

module.exports = Pool;
function Pool(options) {
  this.config = {};
  var config = this.config;
  config.conn_options = options.conn_options;
  config.createConnection = options.createConnection || undefined;
  config.waitForConnections = (options.waitForConnections === undefined)
    ? true : Boolean(options.waitForConnections);
  config.connectionLimit = (options.connectionLimit === undefined)
    ? 10 : Number(options.connectionLimit);

  this._allConnections   = [];
  this._freeConnections  = [];
  this._connectionQueue  = [];
  this._closed           = false;
}

Pool.prototype.getConnection = function(cb) {
  if (this._closed) {
    cb(new Error('Pool is closed.'));
    return;
  }

  if (this._freeConnections.length > 0) {
    var connection = this._freeConnections[0];
    this._freeConnections.shift();
    cb(null, connection);
  } else if (this.config.connectionLimit == 0 || this._allConnections.length < this.config.connectionLimit) {
    var self       = this;
    var connection = this._createConnection(function() {
      if (self._closed) {
        cb(new Error('Pool is closed.'));
      } else {
        cb(null, connection);
      }
    });
    this._allConnections.push(connection);
  } else if (this.config.waitForConnections) {
    this._connectionQueue.push(cb);
  } else {
    cb(new Error('No connections available.'));
  }
};

Pool.prototype.releaseConnection = function(connection) {
  if (connection._poolRemoved) {
    // The connection has been removed from the pool and is no longer good.
    if (this._connectionQueue.length) {
      var cb = this._connectionQueue[0];
      this._connectionQueue.shift();
      process.nextTick(this.getConnection.bind(this, cb));
    }
  } else if (this._connectionQueue.length) {
    var cb = this._connectionQueue[0];
    this._connectionQueue.shift();
    process.nextTick(cb.bind(null, null, connection));
  } else {
    this._freeConnections.push(connection);
  }
};

Pool.prototype.end = function(cb) {
  this._closed = true;
  cb = cb || function(err) { if( err ) throw err; };
  var self              = this;
  var closedConnections = 0;
  var calledBack        = false;
  var endCB = function(err) {
    if (calledBack) {
      return;
    } else if (err) {
      calledBack = true;
      delete endCB;
      cb(err);
    } else if (++closedConnections >= self._allConnections.length) {
      calledBack = true;
      delete endCB;
      cb();
    }
  };

  if (this._allConnections.length == 0) {
    endCB();
    return;
  }

  for (var i = 0; i < this._allConnections.length; ++i) {
    var connection = this._allConnections[i];
    connection.destroy = connection._realDestroy;
    connection.end     = connection._realEnd;
    connection.end(endCB);
  }
};

Pool.prototype._createConnection = function(on_connect) {
  var self = this;
  var config = this.config.conn_options;
  var connection = (this.config.createConnection)
    ? this.config.createConnection(config)
    : Mysql.createTCPClient(config.host, 0, on_connect);
  connection.auth(config.database, config.user, config.password);

  connection._realEnd = connection.end;
  connection.end      = function(cb) {
    self.releaseConnection(connection);
    if (cb) cb();
  };

  connection._realDestroy = connection.close;
  connection.destroy      = function() {
    self._removeConnection(connection);
    connection.close();
  };

  // When a fatal error occurs the connection's protocol ends, which will cause
  // the connection to end as well, thus we only need to watch for the end event
  // and we will be notified of disconnects.
  connection.on('end', this._handleConnectionEnd.bind(this, connection));
  connection.on('error', this._handleConnectionError.bind(this, connection));

  return connection;
};

Pool.prototype._handleConnectionEnd = function(connection) {
  if (this._closed || connection._poolRemoved) {
    return;
  }
  this._removeConnection(connection);
};

Pool.prototype._handleConnectionError = function(connection) {
  if (this._closed || connection._poolRemoved) {
    return;
  }
  this._removeConnection(connection);
};

Pool.prototype._removeConnection = function(connection) {
  connection._poolRemoved = true;
  for (var i = 0; i < this._allConnections.length; ++i) {
    if (this._allConnections[i] === connection) {
      this._allConnections.splice(i, 1);
      break;
    }
  }
  for (var i = 0; i < this._freeConnections.length; ++i) {
    if (this._freeConnections[i] === connection) {
      this._freeConnections.splice(i, 1);
      break;
    }
  }

  connection.end     = connection._realEnd;
  connection.destroy = connection._realDestroy;
  this.releaseConnection(connection);
};
