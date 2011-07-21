// one mysql connection
// TODO: buffers-list
var reader = require('./serializers/reader'); 
var commands = require('./commands');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function packetLength(data)
{
    var len = data.charCodeAt(0);
    len += (data.charCodeAt(1) << 8);
    len += (data.charCodeAt(2) << 16);
    return len;
}

function Connection(socket, authData, client) 
{
    console.error([socket, authData, client]);
    var connection = this;
    connection.client = client;
    connection.socket = socket;
    connection.buffer = '';
    connection.psCache = {}; // prepared statements cache
    connection.socket.setEncoding('binary');
    connection.socket.setTimeout(0);
    connection.authData = authData;    
   
    var authCmd = new commands.auth(authData.db, authData.user, authData.password);
    authCmd.client = client;
    authCmd.connection = this;
    this.currentCommand = authCmd;
    this.currentCommand.process(); // switch start -> read handshake

    connection.socket.on('data', function(data) 
    {
        // todo: replace with buffers-list
        connection.buffer += data;
        var len = packetLength(connection.buffer);

        var buffer = connection.buffer;
        while (buffer.length >= len + 4)
        {
            var packet = buffer.substr(4,len);
            connection.dispatch(new reader(packet) );
            buffer = buffer.substr(len+4, buffer.length-len-4);
            len = packetLength(buffer);
        }
    });
}
util.inherits(Connection, EventEmitter);

Connection.prototype.dispatch = function(packet) 
{
    /*
    if (!this.currentCommand)
    {
        if (this.client.queue.length == 0)
        {
            // error?
            console.error('!!!!!!!!!!!!!!123');
            return;
        }
        this.currentCommand = this.client.queue.shift();
    }
    */
    if (this.currentCommand.process(packet))
    {
        if (!this.client.queue.length == 0)
        {        
            this.currentCommand = this.client.queue.shift();
            this.currentCommand.connection = this;
            this.dispatch();
        } else {
            var client = this.client;
            client.idleConnections.push(this);
            client.emit('idle', this);
        } 
    } 
}

Connection.prototype.writePacket = function(packet, pnum) 
{
    packet.addHeader(pnum);
    this.socket.write(packet.data, 'binary');
}

module.exports = Connection;