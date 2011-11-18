var assert = require('assert');
var createConnection = require('./common').createConnection;

module.exports = {
  'test error on query': function(beforeExit) {
    var db = createConnection();
    var testEndCalled = false
    
    // attempt to run a bunk query
    db.query('SELECT * FROM').on('error', function(error) {
      assert.equal(error.num, 1064)
      db.close()
    }).on('end', function() {
      // this shouldn't be called in the event of an error
      testEndCalled = true
      db.close()
    })
    
    beforeExit(function() {
      assert.equal(testEndCalled, false)
    })
    
  },
  
  'test error on empty query': function(beforeExit) {
    
    var db = createConnection();
  
    var testEndCalled = false
    
    // attempt to run a bunk query
    db.query('').on('error', function(error) {
      assert.equal(error.num, 1065)
      db.close()
    }).on('end', function() {
      // this shouldn't be called in the event of an error
      testEndCalled = true
      db.close()
    })
    
    beforeExit(function() {
      assert.equal(testEndCalled, false)
    })
  },

  'test error on execute': function(beforeExit) {

    var db = createConnection();
    var testEndCalled = false
    // attempt to run a bunk query
    db.execute('SELECT * FROM tbl WHERE id = ?', []).on('error', function(error) {
      assert.equal(error.num, 1210)
      db.close()
    }).on('end', function() {
      // this shouldn't be called in the event of an error
      testEndCalled = true
      db.close()
    })
    
    beforeExit(function() {
      assert.equal(testEndCalled, false)
    })
  }
}