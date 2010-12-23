var sys = require('sys')
  , assert = require('assert')
  , mysql = require('../lib/mysql-native')

module.exports = {
  
  'test insert quoted': function() {
    
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .auth("test", "testuser", "testpass")

    var sql = 'INSERT INTO tbl SET id = NULL, field = ' + db.quote("this is' a test\" 'quoted' string")
    db.query(sql).addListener('row', function(r) {
      console.log('inserted')
    }).addListener('end', function() {
      db.close()
    })
    
  },
  
  'test insert quoted multiline': function() {
    
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .auth("test", "testuser", "testpass")

    var sql = 'INSERT INTO tbl SET id = NULL, field = ' + db.quote("this is' a test\" 'quoted' string\nwith multiple\nlines")
    db.query(sql).addListener('result', function(r) {
      assert.ok(r.insert_id > 0)
    }).addListener('end', function() {
      db.close()
    })
    
  }
}