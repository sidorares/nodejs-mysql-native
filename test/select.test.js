var mysql = require('../lib/mysql-native');
var assert = require('assert');

module.exports = {

  'test select 1+1 + callback': function(cb) {
    var db = mysql.createClient({ database: 'test', port: 3306 });
    db.query('select 1+1 as qqq', function(err, res) {
      console.log([err, res])
      this.connection.socket.end();
      cb();
    });  
  },
  
  'test select all rows result event': function(cb) {
      assert.equal(1,2, '1 should be equal to 2');
      cb();
  },
}
