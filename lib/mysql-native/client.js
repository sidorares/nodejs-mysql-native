
var reader = require('./serializers').reader;
var writer = require('./serializers').writer;
var cmd = require('./commands')
var net = require('net');
var sys = require('sys');
var queue = require('./containers').queue;

function packetLength(data)
{
    var len = data.charCodeAt(0);
    len += (data.charCodeAt(1) << 8);
    len += (data.charCodeAt(2) << 16);
    return len;
}

exports.createTCPClient = function(host, port)
{
    var host = host ? host : "localhost";
    var port = port ? port : 3306;
    var connection = net.createConnection(port, host);
    connection.pscache = {};
    connection.setEncoding("binary");
    connection.setTimeout(0);

    return new socketClient(connection);
}

exports.createUNIXClient = function(path)
{
    var path = path ? path : "/var/run/mysqld/mysqld.sock";
    var connection = net.createConnection(path);
    connection.pscache = {};
    connection.setEncoding("binary");
    connection.setTimeout(0);

    return new socketClient(connection);
}
    
function dump(d)
{
   return;
   for (var i=0; i < d.length; ++i)
   {
       sys.puts(i.toString() + " " + d.charAt(i) + " " + d.charCodeAt(i).toString());
   }
}

 
socketClient = function(connection) {
  
    var client = this;
    this.commands = new queue();
    this.connection = connection;
    connection.buffer = "";

    // add the api command methods to the client
    var apimethods = Object.getOwnPropertyNames(cmd)
    apimethods.forEach(function(name, i, apimethods) {
      client[name] = function() {
        return this.add(cmd[name].apply(client, arguments))
      }
    })
 
    this.terminate = function()
    {
        this.connection.end();
    }

    this.write_packet = function(packet, pnum)
    {
        packet.addHeader(pnum);
        this.connection.write(packet.data, 'binary');
    }

    this.dispatch_packet = function(packet)
    {
        if (this.commands.empty())
            return;
        if (this.commands.top().process_packet(packet))
        {
            this.commands.shift();
            this.connection.emit('queue', this.commands.length);
            this.dispatch_packet();
        }
    }

    // proxy request to socket eventemitter
    this.on = this.addListener = function()
    {
        this.connection.addListener.apply(this.connection, arguments);
    }

    this.add = function(c)
    {
        c.connection = this;
        var need_start_queue = this.connection.connected && this.commands.empty();
        this.commands.push(c);
        this.connection.emit('queue', this.commands.length); 
        if (need_start_queue)
            this.dispatch_packet();

        var connection = this.connection;
        
        //c.addListener('end', function(cmd) { connection.emit('command_end', c); });

        // throw an exception in the event of some kind of error
        c.addListener('error', function(e) { 
          throw new Error(e.message)
        });
        
        return c;
    } 

    this.connection.addListener("data",
        function(data)
        {
            // TODO: move to 'onconnect' event
            // replace connected with 'first packet' or 'ready state' or smth similar
            if (!this.connected)
            {
                this.connected = true;
                client.dispatch_packet();
            }

            this.buffer += data;
            var len = packetLength(this.buffer);

            while (this.buffer.length >= len + 4)
            {
                var packet = this.buffer.substr(4,len);
                client.dispatch_packet(new reader(packet) );
                this.buffer = this.buffer.substr(len+4, this.buffer.length-len-4);
                len = packetLength(this.buffer);
            }
        }
    );

    return client;
}
    
