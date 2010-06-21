#!/usr/local/bin/node

var sys = require("sys");
var db = require("mysql/client").createTCPClient(); // localhost:3306 by default
db.auto_prepare = true;
function dump_rows(cmd)
{
   cmd.addListener('row', function(r) { sys.puts("row: " + sys.inspect(r)); } );
}

db.auth("test", "testuser", "testpass");
dump_rows(db.execute("select ?,?", ["hello", "world"]));
dump_rows(db.execute("select ?,?", ["hello", null]));
dump_rows(db.execute("select ?,?", [null, "hello"]));
db.close();

