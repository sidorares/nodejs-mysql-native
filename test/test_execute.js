#!/usr/local/bin/node

var sys = require("sys");   
var mysql = require("../lib/mysql-native");

var db = mysql.createTCPClient();
db.auth("test", "testuser", "testpass");
db.prepare(process.argv[2]);
var examplecmd = db.execute(process.argv[2], process.argv.slice(3));
examplecmd.addListener('row', function(r) { sys.puts("binrow received:  " + sys.inspect(r)); } );
examplecmd.on('error', function(s) { sys.p(s); } );
db.close();
