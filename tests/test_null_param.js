#!/usr/local/bin/node

var sys = require("sys");
var db = require("../lib/mysql-native").createTCPClient(); // localhost:3306 by default
db.auto_prepare = true;
function dump_rows(cmd)
{
   cmd.addListener('row', function(r) { sys.puts("row: " + sys.inspect(r)); } );
}

db.auth("test", "root", "root");


var params = [null, 'test', null, 'test', 'test', null, 'test', 8, 'test', 'testagain',
null, 'test', null, 'test', 'test', null, 'test', 8, 'test', 'testagain', undefined]

dump_rows(db.execute("select ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?", params));
dump_rows(db.execute("select ?,?", ["hello", null]));
dump_rows(db.execute("select ?,?,?,?,?,?", [null, 'hola', null, 'test', 'test2', 'another str']));
dump_rows(db.execute("select ?,?,?,?,?,?", [null, 'hola', 'word', null, 'sdfsdf', '5']));

db.query("create temporary table nullparams( \
  id int(11) unsigned NOT NULL AUTO_INCREMENT, \
  a int(11) unsigned NULL, \
  b varchar(255) CHARACTER SET utf8 DEFAULT NULL, \
  c text CHARACTER SET utf8, \
  PRIMARY KEY (id) \
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;").addListener('end', function() {
  dump_rows(db.execute("insert into nullparams (a, b, c) values (?,?,?)", [null, "word", null]))
  dump_rows(db.execute("select * from nullparams"))
  db.close();  
})

