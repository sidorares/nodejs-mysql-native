#!/usr/local/bin/node

var sys = require("sys");
var http = require("http");
var url = require("url");
var mysql = require("mysql-native");

process.addListener('uncaughtException', function(err) { sys.p(err); });

function test_datasource()
{
   var db = mysql.createTCPClient(); 
   db.auto_prepare = true;
   db.auth("test", "testuser", "testpass");
   return db;
}

var dbpool = new mysql.pool(test_datasource, 16);
dbpool.max_connections = 32;

function dump_row(row, res)
{
    res.write("<tr>");
    for (var i=0; i < row.length; ++i)
    {
        res.write("<td>" + row[i] + "</td>"); 
    }
    res.write("</tr>\n");
}

http.createServer(function (req, res) {
  var query = url.parse(req.url, true).query;
  if (!query)
  {
      res.end();
      return;
  }

  var q = query.q;
  sys.p(q);
  dbpool.get(
      function(conn) 
      {

          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write("<html><body><table>\n<tr>");
          conn.query(q)
              .addListener('field', function(f) { res.write("<td>" + f.name + "</td>"); }) 
              .addListener('fields_eof', function() { res.write("</tr>\n"); }) 
              .addListener('row', function(r) { dump_row(r, res); }) 
              .addListener('end', function() { res.write("</table></body></html>"); res.end(); });
      }
  ); 
}).listen(8080, "127.0.0.1");
