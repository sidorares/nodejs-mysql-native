var sys = require('sys')
  , assert = require('assert')
  , mysql = require('../lib/mysql-native')

module.exports = {
  'test select all rows row event': function() {

    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('row_as_hash', true)
      .auth("test", "testuser", "testpass")

    var sql = 'SELECT * FROM tbl'
    db.query(sql).addListener('row', function(r) {
      assert.ok(typeof r == 'object')
    }).addListener('end', function() {
      db.close()
    })
    
  },
  
  'test select all rows result_complete event': function() {
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .auth("test", "testuser", "testpass")

    var sql = 'SELECT * FROM tbl'
    db.query(sql).addListener('result_complete', function(r) {
      assert.ok(r.rows.length > 0)
    }).addListener('end', function() {
      db.close()
    })
  },
  
  'test select no results': function() {
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .auth("test", "testuser", "testpass")

    var sql = 'SELECT * FROM tbl WHERE id = 1000000000'
    db.query(sql).addListener('result_complete', function(r) {
      assert.ok(r.rows.length == 0)
    }).addListener('end', function() {
      db.close()
    })
  },
  
  'test result field null number': function() {
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('row_as_hash', true)
      .auth("test", "testuser", "testpass")

    // first insert a record that we know has a null value
    db.query('INSERT INTO tbl SET parent = NULL').addListener('result', function(res) {
      var insert_id = res.insert_id
      
      var sql = 'SELECT * FROM tbl WHERE id = ' + insert_id
      db.query(sql).addListener('row', function(r) {
        assert.isNull(r.parent)
      })
    }).addListener('end', function() {
      db.close()
    })
  },
  
  'test result field non null number': function() {
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('row_as_hash', true)
      .auth("test", "testuser", "testpass")

    // first insert a record that we know has a null value
    db.query('INSERT INTO tbl SET parent = 1').addListener('result', function(res) {
      
      var insert_id = res.insert_id

      var sql = 'SELECT * FROM tbl WHERE id = ' + insert_id
      db.query(sql).addListener('row', function(r) {
        assert.eql(r.parent, 1)
      })
      
    }).addListener('end', function() {
      db.close()
    })
  }
}