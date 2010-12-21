#!/usr/local/bin/node

var sys = require("sys");   
var db = require("../lib/mysql-native").createTCPClient();

db.auth("test", "testuser", "testpass").addListener('authorized', function(s) { sys.puts("authorized as " + sys.inspect(s)); });
db.query(process.argv[2]).addListener('row', function(r) { sys.puts("row:  " + sys.inspect(r)); } );
db.close();
