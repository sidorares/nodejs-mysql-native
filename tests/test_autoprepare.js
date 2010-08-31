#!/usr/local/bin/node

var sys = require("sys");   
var db = require("mysql-native").createTCPClient();

db.auth("test", "testuser", "testpass");

db.auto_prepare = true;
var sql = process.argv[2];
// db.prepare(sql);
db.row_as_hash = true;
db.execute(sql, process.argv.slice(3))
//  .addListener('field', function(f) { sys.puts( "field: " + sys.inspect(f)); })
  .addListener('row', function(r) { sys.puts("row:  " + sys.inspect(r)); } );

db.close();
