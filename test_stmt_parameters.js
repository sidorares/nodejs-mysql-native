#!/usr/local/bin/node

var sys = require("sys");   
var db = require("mysql/client").createTCPClient();

db.auth("test", "testuser", "testpass");
//var sql = "select null,null,2,null,1,null,null";
var sql = process.argv[2];
db.prepare(sql);
db.execute(sql, process.argv.slice(3))
  .addListener('field', function(f) { sys.puts( "field: " + sys.inspect(f)); })
  .addListener('row', function(r) { sys.puts("row:  " + sys.inspect(r)); } );
db.close();
