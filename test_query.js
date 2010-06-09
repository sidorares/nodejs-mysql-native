#!/usr/local/bin/node

var sys = require("sys");   
var db = require("mysql/client").createTCPClient();

db.auth("test", "testuser", "testpass");
db.query(process.argv[2]).addListener('row', function(r) { sys.puts("row received:  " + sys.inspect(r)); } );
db.close();
