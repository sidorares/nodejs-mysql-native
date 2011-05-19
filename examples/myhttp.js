#!/usr/local/bin/node

var http = require('http');
var url = require('url');
var mysql = require('../lib/mysql-native');

process.on('uncaughtException', function(err) 
{
    console.error(err); 
});

function test_datasource()
{
   var db = mysql.createTCPClient('127.0.0.1'); 
   db.auto_prepare = true;
   db.auth('nodebench_test_db', 'root', '');
   db.set('row_as_hash', false);
   return db;
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

var conn = test_datasource();

http.createServer(function (req, res) {
  var query = url.parse(req.url, true).query;
  if (!query)
  {
      res.end();
      return;
  }

  if (!query.q && !query.db)
  {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write("<html><body><table>\n<tr>");
      conn.query('show databases;')
          .on('field', function(f) { res.write("<td>" + f.name + "</td>"); }) 
          .on('fields_eof', function() { res.write("</tr>\n"); }) 
          .on('row', function(r) { res.write('<tr><td><a href="/?db=' + r[0] + '">' + r[0] + '</a></td><tr>\n'); }) 
          .on('end', function() { res.end("</table></body></html>"); })
          .on('error', function(e) { res.end(e.message); });
          
  } else if (query.db)
  {
       conn.query('use ' + query.db).on('end', function()
       {
           var q = query.q;
           var db = query.db;
           if (!q)
           {
              res.write("<html><body><table>\n<tr>");
              conn.query('show tables')
                   .on('field', function(f) { res.write("<td>" + f.name + "</td>"); }) 
                   .on('fields_eof', function() { res.write("</tr>\n"); }) 
                   .on('row', function(r) { res.write('<tr><td><a href="/?db=' + db + '&q=select * from ' + r[0] + '">' + r[0] + '</a></td><tr>\n'); }) 
                   .on('end', function() { res.end("</table></body></html>"); })
                   .on('error', function(e) { res.end(e.message); });
           } else {
               res.writeHead(200, {'Content-Type': 'text/html'});
               res.write("<html><body><table>\n<tr>");
               conn.query(q)
                   .on('field', function(f) { res.write("<td>" + f.name + "</td>"); }) 
                   .on('fields_eof', function() { res.write("</tr>\n"); }) 
                   .on('row', function(r) { dump_row(r, res); }) 
                   .on('end', function() { res.end("</table></body></html>"); })
                   .on('error', function(e) { res.end(e.message); });
           }
       });
  }
     
}).listen(8080, "127.0.0.1");