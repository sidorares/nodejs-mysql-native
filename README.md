# About
Mysql client module for node.js, written in JavaScript. No other mysql runtime required.

[![Build Status](https://secure.travis-ci.org/sidorares/nodejs-mysql-native.png)](http://travis-ci.org/sidorares/nodejs-mysql-native)

# Install
`npm install mysql-native`

# Community
Check out the google group http://groups.google.com/group/node-mysql-native for questions/answers from users of the driver.


# Example
<pre>var db = require("mysql-native").createTCPClient(); // localhost:3306 by default
db.auto_prepare = true;
function dump_rows(cmd)
{
   cmd.addListener('row', function(r) { console.dir(r); } );
}

db.auth("test", "testuser", "testpass");
dump_rows(db.query("select 1+1,2,3,'4',length('hello')"));
dump_rows(db.execute("select 1+1,2,3,'4',length(?)", ["hello"]));
db.close();</pre>

output is:
row: [ 2, 2, 3, "4", 5]
row: [ 2, 2, 3, "4", 5]

# Highlights

* commands are pipelined
* types are converted mysql<->javascript according to field type
* prepared statements are cached and auto-prepared
* row packet ( query ) and binary row packet ( execute ) handled transparently equal

#API

## Module Functions
* createClient(socket) -  create client from duplex stream (TODO: add default path to local server socket)
* createTCPClient(host, port) - create tcp client, default host 127.0.0.1, port 3306
* createUNIXClient(path) - connect to unix domain socket, default is /var/run/mysqld/mysqld.sock

## Client Functions
All commands fire 'end'() event at the end of command executing.

* `auth(db, user, pass)` - perform mysql connection handshake. Should be always a first command (TODO: add default user/pass if missing?).
Events:
    'authorized'(serverStatus) event. 

* `query(sql)` - simple query.
Events:
    'field'(field) - one for each field description
    'fields_eof'() - after last field
    'row'(rows) - array of field values, fired for each row in result set

* `client.prepre(sql)` - prepare a statement and store result in client.pscache
Events:
    'prepared'(preparedStatement)
    'parameter'(field) - input parameter description

* `execute(sql, parameters)` - parameters is an array of values. Known types are sent in appropriate mysql binary type (TODO: currently this is not true, type is always string and input converted using param.toString() )
Events:
   same as with query()
   
* `client.close` - create and enqueue corresponding command
* `client.execute` also adds prepare command if there is no cached statement and client.auto_prepare set to true (TODO: add better api than client.auto_prepare flag)
* `client.terminate` - close conection immediately

# TODO

* buffers 

# LINKS

MySql protocol documentation:
 
* <http://forge.mysql.com/wiki/MySQL_Internals_ClientServer_Protocol>

Other node.js mysql clients:

* <http://github.com/felixge/node-mysql>
* <http://github.com/Sannis/node-mysql-libmysqlclient>
* <http://github.com/Guille/node.dbslayer.js>
