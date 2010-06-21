var queue = require('./containers').queue;

function pool(newConnectionFactory)
{
   this.newConnectionFactory = newConnectionFactory;
   this.connections = [];

   // some reasonable defaults
   this.minConnections = 0; // lazy by default 
   this.maxConnections = 16;
   this.maxQueue = 2; // increase if average command time is much shorter compared to connect time
                      // TODO: calculate ratio on the fly? think of adaptiveMaxQueue
   this.idleTimeout = 0; // TODO: also possible to make adaptive
   this.maxWaiters = -1; // TODO: infinity?

   this.waiters = new queue();
   for (var i=0; i < minConnections; ++i)
      spawnConnection();
}

pool.prototype.spawnConnection = function()
{
    var client = this.newConnectionFactory();
    var self = this;
    // todo: Qt-style connection-slot api?
    client.connection.addListener('command_end', function() { self.queueChanged(client); });
}

pool.prototype.queueChanged = function(client)
{
    var new_size = client.commands.length;
    if (!this.waiters.empty() && new_size <= this.maxQueue)
    {
        var w = this.waiters.shift();
        w(client);
    }

    // there is no commands left for current connection
    // close it after idleTimeout
    if (new_size == 0 && this.connections.length > this.minConnections)
    {
        if (this.idleTimeout > 0)
        {
            //todo: add close timer
        } else {
            client.close();
        }
    }

    // calculate new index
}

pool.prototype.get = function(onClientReady)
{
    // select client with minimal queue
    // if its queue length <= maxQueue, return it
    // if connections size less than maxConnection, spawn a new connection
    // else enqueue request
    // throw error if waiters queue length > maxWaiters
}
