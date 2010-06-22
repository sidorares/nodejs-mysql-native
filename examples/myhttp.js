#!/usr/local/bin/node

var sys = require("sys");
var http = require("http");
var url = require("url");
var client = require("mysql/client");
var pool = require("mysql/pool").pool;

function test_datasource()
{
   var db = client.createTCPClient(); 
   db.auto_prepare = true;
   db.auth("test", "testuser", "testpass");
   return db;
}

var dbpool = new pool(test_datasource, 16);
dbpool.max_connections = 32;

function start_html(res)
{
    res.write("<html><body><table>\n<tr>");
}

function dump_field(f, res)
{
    res.write("<td>" + f.name + "</td>");
}

function close_header(res)
{
    res.write("</tr>\n");
}

function dump_row(row, res)
{
    res.write("<tr>");
    for (var i=0; i < row.length; ++i)
    {
        res.write("<td>" + row[i] + "</td>"); 
    }
    res.write("</tr>\n");
}

function close_html(res)
{
    res.write("</table></body></html>");
    res.end();
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
          start_html(res);
          conn.query(q)
              .addListener('field', function(f) { dump_field(f, res); }) 
              .addListener('fields_eof', function() { close_header(res); }) 
              .addListener('row', function(r) { dump_row(r, res); }) 
              .addListener('end', function() { close_html(res); });
      }
  ); 
}).listen(8080, "127.0.0.1");

