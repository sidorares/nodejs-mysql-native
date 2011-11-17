var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var commands = require('./commands');
var Connection = require('./connection')

function Client()
{
    this.queue = [];
    this.connections = [];
    this.idleConnections = [];
    this.lastConnectionId = 0;
}
util.inherits(Client, EventEmitter);

Client.prototype.addConnection = function(params)
{
    if (params === undefined)
    {
        if (this.previousParams === undefined)
            params = {}
        else
            params = this.previousParams;
    }
    else {
        this.previousParams = params;
    }

    if (typeof params == 'string')
    {
        // TODO: parse url 'mysql://me:pass@host:port/db';
        throw 'not yet';     
    }

    var auth = {
        user: params.user,
        password: params.password,
        database: params.db
    };

    if (params.database)
         auth.database = params.database;

    if (!params.socket && !params.host && !params.port)
        params.socket = '/var/run/mysqld/mysqld.sock'; 

    var stream;
    // TODO: are any standart environment variables 
    //       used to declare default connection?
    if (!params.socket)
    {
        var port = params.port ? params.port : 3306;
        var host = params.host ? params.host : '127.0.0.1'; 

        console.log([port, host]);
        stream = net.createConnection(port, host);
    } else {
        console.log(params);
        stream = net.createConnection(params.socket);
    }
    
    var connection = new Connection(stream, auth, this);
    connection.id = this.lastConnectionId;
    this.lastConnectionId++;
    this.connections.push(connection);
}

Client.prototype.query = function(sql, callback)
{
    return this.add(new commands.query(sql, callback));
}

Client.prototype.add = function(cmd)
{
    cmd.client = this;
    this.queue.push(cmd);
    this.dispatch();
    return cmd;
}

Client.prototype.dispatch = function()
{
    if (this.connections.length != 0)
    {
        var conn = this.connections.shift();
        conn.checkQueue();
    } 
}

exports.createClient = function(params)
{
    var client = new Client();
    client.addConnection(params);
    return client;   
}
