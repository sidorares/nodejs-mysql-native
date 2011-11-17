var mysql = require('./client');
var db = mysql.createClient({
    socket: '/var/run/mysqld/mysqld.sock',
    user: 'root',
    password: 'tetris'
});
//db.query('select sleep(10)', function(err, res) 
//{
//     console.log(res);
     //this.client.end();
//});

//for (var ii=0; ii < 49; ii++)
//    db.addConnection();


//db.query('select sleep(10) as a1', function(err, res) 
//{
//     console.log(res);
//});


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


var left = 10000;
var start = +new Date;
function bench()
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
        }
    });
}

bench();
