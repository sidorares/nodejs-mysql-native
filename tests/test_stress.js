#!/usr/local/bin/node

var sys = require("sys");   

var createTCPClient = require("../lib/mysql-native").createTCPClient;
var numclients = process.argv[2];
var clients = []

sys.p(numclients);

for (var c=0; c < numclients; ++c)
{
    var db = createTCPClient();
    db.id = c;
    sys.puts(db.id);
    clients.push(db);
    db.auth("test", "testuser", "testpass");
}

var numcommands = process.argv[3];
for (var i=0; i < numcommands; ++i)
{
   var c = clients[i % numclients];
   if (i % 100 == 0)
   {
        c.debug("command number " + i);
   }
   c.query(process.argv[4]);
}
sys.puts("commands inserted");

for (var c=0; c < numclients; ++c)
{
   clients[c].close();
}
