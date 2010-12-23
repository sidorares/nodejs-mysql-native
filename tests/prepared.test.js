var sys = require('sys')
  , assert = require('assert')
  , mysql = require('../lib/mysql-native')

module.exports = {
  
  'test autoprepare': function() {
    
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .auth("test", "testuser", "testpass")
    
    var sql = 'SELECT * FROM tbl WHERE id = ?'
    db.execute(sql, [1]).addListener('row', function(r) {
      assert.isDefined(r.id)
    }).addListener('end', function() {
      db.close()
    })
    
  },
  
  'test prepare params': function() {

    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('row_as_hash', false)
      .auth("test", "testuser", "testpass")
      
    var params = ['param', 'param2', 'param3']

    db.execute("select ?,?,?", params).addListener('row', function(r) {
      assert.includes(r, 'param')
      assert.length(r, 3)
    }).addListener('end', function() {
      db.close();
    })
  },
  
  'test prepare null params': function() {

    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('row_as_hash', false)
      .auth("test", "testuser", "testpass")
      
    var params = [null, null, null]

    db.execute("select ?,?,?", params).addListener('row', function(r) {
      assert.includes(r, null)
      assert.length(r, 3)
    }).addListener('end', function() {
      db.close();
    })
    
  },
  
  'test prepare undefined params': function() {

    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('row_as_hash', false)
      .auth("test", "testuser", "testpass")
      
    var params = [undefined, undefined, undefined]

    db.execute("select ?,?,?", params).addListener('row', function(r) {
      assert.includes(r, null)
      assert.length(r, 3)
    }).addListener('end', function() {
      db.close();
    })
    
  },
  
  'test prepare mixed params': function() {

    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('row_as_hash', false)
      .auth("test", "testuser", "testpass")
      
    var params = [null, 'param2', undefined]

    db.execute("select ?,?,?", params).addListener('row', function(r) {
      assert.isNull(r[0], null)
      assert.eql(r[1], 'param2')
      assert.eql(r[2], null)
      assert.length(r, 3)
    }).addListener('end', function() {
      db.close();
    })
    
  },
  
  'test execute result complete': function() {
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('row_as_hash', false)
      .auth("test", "testuser", "testpass")

    db.execute("select ?,?,?", [ 'test', null, 1]).addListener('result', function(res) {
      assert.length(res.rows, 1)
    }).addListener('end', function() {
      db.close();
    })
  }
}