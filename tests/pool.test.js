var sys = require("sys");
var mysql = require("../lib/mysql-native");

function createConnection()
{
   var db = mysql.createTCPClient(); 
   db.set('auto_prepare', true)
     .auth("test", "testuser", "testpass");
   return db;
}

function test_pool(pool)
{
  for (var i = 0; i < 6; i++)
  {
      pool.get(function(conn) {
        dump_rows(conn.execute("select sleep(2),?", [0+i]));
      })
  }
}

function dump_rows(cmd)
{
   cmd.addListener('row', function(r) { sys.puts("row: " + sys.inspect(r)); } );
}

/*
module.exports = {
  'test connection pooling': function(beforeExit) {
    
    var dbpool = new mysql.pool(createConnection, 3);
    
    setTimeout(function() { test_pool(dbpool); }, 1000);
    setTimeout(function() { test_pool(dbpool); }, 2000);
    setTimeout(function() { test_pool(dbpool); }, 3000);
    setTimeout(function() { test_pool(dbpool); }, 4000);
    
    beforeExit(function() {
    })
  }
}*/
/*
var dbpool = new mysql.pool(createConnection, 3);

function test_pool(p)
{
    for (var i=0; i < 6; ++i)
    {
        p.get( 
            function(conn)
            {
                dump_rows(conn.execute("select sleep(2),?", [0+i]));
            }
        );
    }
}

//test_pool(dbpool);
setTimeout(function() { test_pool(dbpool); }, 1000);
*/
/*
setTimeout(function() { test_pool(dbpool); }, 2000);
setTimeout(function() { test_pool(dbpool); }, 3000);
setTimeout(function() { test_pool(dbpool); }, 4000);
*/

