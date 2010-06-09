#!/usr/local/bin/node

var sys = require("sys");   
var db = require("mysql/client").createTCPClient();

db.auth("test", "testuser", "testpass");
db.prepare(process.argv[2]);
db.execute(process.argv[2]).addListener('binrow', function(r) { sys.puts("binrow received:  " + sys.inspect(r)); } );
db.close();
