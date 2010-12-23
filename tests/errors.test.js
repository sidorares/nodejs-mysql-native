var sys = require("sys")
  , assert = require('assert')
  , mysql = require("../lib/mysql-native");

module.exports = {
  'test error on query': function(beforeExit) {
    
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .auth("test", "testuser", "testpass")
    
    var testEndCalled = 0
    
    // attempt to run a bunk query
    db.query('SELECT * FROM').on('error', function(error) {
      assert.eql(error.num, 1064)
      db.close()
    }).on('end', function() {
      // this shouldn't be called in the event of an error
      testEndCalled = 1
      db.close()
    })
    
    beforeExit(function() {
      assert.eql(testEndCalled, 0)
    })
  }
}