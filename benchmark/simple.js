var mysql = require('../lib/mysql-native');
var db = mysql.createClient({
    port: 3306,
    db: 'test'
});

/*
var http = require('http');

http.createServer(function(req, res)
{
    //db.query('select sleep(0.1) as qqq', function(err, dbres) {
    db.query('select 1 as qqq', function(err, dbres) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        console.log(dbres);
        res.write(dbres[0].qqq + ' ' + this.connection.id);
        console.log(this.connection.id);
        res.end();
    });
}).listen(8081);
*/

var left = 10000;
var start = +new Date;
function bench(sql, cb)
{
    db.query('select 1', function(err, res) {
        left--;
        if (left % 1000 == 0)
        {
            console.log(+new Date - start);
        }

        if (left > 0)
            bench();
        else {
            console.log( 10000000/(+new Date() - start) );
            db.query('select 1', function() { this.connection.socket.end(); });
        }
    });
}

bench();
