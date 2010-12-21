#!/usr/local/bin/node

var sys = require("sys");
var db = require("../lib/mysql-native").createTCPClient(); // localhost:3306 by default
db.auto_prepare = true;
function dump_rows(cmd)
{
   cmd.addListener('row', function(r) { sys.puts("row: " + sys.inspect(r)); } );
}

db.auth("test", "testuser", "testpass");
dump_rows(db.query("select 1+1,2,3,'4',length('hello')"));
dump_rows(db.execute("select 1+1,2,3,'4',length(?)", ["hello"]));
db.close();

