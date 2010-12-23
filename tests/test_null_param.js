#!/usr/local/bin/node

var sys = require("sys");
var db = require("../lib/mysql-native").createTCPClient(); // localhost:3306 by default
db.auto_prepare = true;
function dump_rows(cmd)
{
   cmd.addListener('row', function(r) { sys.puts("row: " + sys.inspect(r)); } );
}

db.auth("test", "testuser", "testpass");

var params = [null, 'test', null, 'test', 'test', null, 'test', 8, 'test', 'testagain',
null, 'test', null, 'test', 'test', null, 'test', 8, 'test', 'testagain', undefined]

dump_rows(db.execute("select ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?", params));
dump_rows(db.execute("select ?,?", ["hello", null]));
dump_rows(db.execute("select ?,?,?,?,?,?", [null, 'hola', null, 'test', 'test2', 'another str']));
dump_rows(db.execute("select ?,?,?,?,?,?", [null, 'hola', 'word', null, 'sdfsdf', '5']));
db.close();
