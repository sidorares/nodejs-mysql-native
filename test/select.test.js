var mysql = require('../lib/mysql-native')

module.exports = {

  'test select 1+1 + callback': function(a, b, c) {
    console.log(a,b,c);
    var db = mysql.createClient({ database: 'test' });
    db.query('select 1+1 as qqq', function(err, res) {
      db.close();
    });  
  },
  
  'test select all rows result event': function() {
  },
}
