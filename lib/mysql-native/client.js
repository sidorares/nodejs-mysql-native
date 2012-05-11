var net = require('net');
var util = require('util');

var SocketClient = require('./socketclient')

exports.createTCPClient = function(host, port, connectListener)
{
    var host = host ? host : '127.0.0.1';
    var port = port ? port : 3306;
    var connection = net.createConnection(port, host, connectListener);

    return new SocketClient(connection);
}

exports.createUNIXClient = function(path)
{
    var path = path ? path : "/var/run/mysqld/mysqld.sock";
    var connection = net.createConnection(path);

    return new SocketClient(connection);
}

function dump(d)
{
   return;
   for (var i=0; i < d.length; ++i)
   {
       util.puts(i.toString() + " " + d.charAt(i) + " " + d.charCodeAt(i).toString());
   }
}
