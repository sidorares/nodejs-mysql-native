var mysql = require('./client');

var client = mysql.createClient({ user: 'root', port: 3306, database: 'test'});

var q = client.query('select * from t1');
q.on('row', function(r) {
   console.log(r);
});