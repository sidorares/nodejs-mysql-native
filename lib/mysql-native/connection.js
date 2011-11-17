// one mysql connection
// TODO: buffers-list
var reader = require('./serializers/reader'); 
var commands = require('./commands');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function packetLength(data)
{
    if (data.length == 0)
        return 0;
    var len = data.charCodeAt(0);
    len += (data.charCodeAt(1) << 8);
    len += (data.charCodeAt(2) << 16);
    return len;
}

function Connection(socket, authData, client) 
{
    var connection = this;
    connection.client = client;
    connection.socket = socket;
    connection.buffer = '';
    connection.psCache = {}; // prepared statements cache
    connection.socket.setEncoding('binary');
    connection.socket.setTimeout(0);
    connection.authData = authData;    
   
    var authCmd = new commands.auth(authData.database, authData.user, authData.password);
    authCmd.client = client;
    authCmd.connection = this;
    this.currentCommand = authCmd;
    this.currentCommand.process(); // switch start -> read handshake

    connection.socket.on('data', function(data) 
    {
        // todo: replace with buffers-list
        connection.buffer += data.toString('binary');
        var len = packetLength(connection.buffer);

        while (connection.buffer.length >= len + 4)
        {
            debugger;
            var packet = connection.buffer.substr(4,len);
            connection.dispatch(new reader(packet) );
            connection.buffer = connection.buffer.substr(len+4, connection.buffer.length-len-4);
            if (connection.buffer.length == 0)
                break;
            len = packetLength(connection.buffer);
        }
    });
}
util.inherits(Connection, EventEmitter);

Connection.prototype.checkQueue = function() 
{
     if (this.currentCommand)
         return;

     if (!this.client.queue.length == 0)
     {        
         this.currentCommand = this.client.queue.shift();
         this.currentCommand.connection = this;
         this.currentCommand.process();
     }
}

Connection.prototype.dispatch = function(packet) 
{
    if (this.currentCommand.process(packet))
    {
        if (!this.client.queue.length == 0)
        {        
            this.currentCommand = this.client.queue.shift();
            this.currentCommand.connection = this;
            this.dispatch();
        } else {
            this.currentCommand = null;
            this.client.connections.push(this);
            this.client.emit('idle', this);
        } 
    } 
}

Connection.prototype.writePacket = function(packet, pnum) 
{
    packet.addHeader(pnum);
    this.socket.write(packet.data, 'binary');
}

module.exports = Connection;
