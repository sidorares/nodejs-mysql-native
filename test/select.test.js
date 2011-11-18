var assert = require('assert');
var createConnection = require('./common').createConnection;

module.exports = {
  'test select all rows row event': function(cb) {
    var db = createConnection();
    var sql = 'SELECT * FROM tbl'
    db.query(sql).addListener('row', function(r) {
      assert.ok(typeof r == 'object')
    }).addListener('end', function() {
      db.close();
      cb();
    })
    
  },
  
  'test select all rows result event': function(cb) {
    var db = createConnection();
    var sql = 'SELECT * FROM tbl'
    db.query(sql).addListener('result', function(r) {
      assert.ok(r.rows.length > 0)
    }).addListener('end', function() {
      db.close();
      cb();
    })
  },
  
  'test select no results': function(cb) {
    var db = createConnection();
    var sql = 'SELECT * FROM tbl WHERE id = 1000000000'
    db.query(sql).addListener('resulti', function(r) {
      assert.ok(r.rows.length == 0)
    }).addListener('end', function() {
      db.close();
      cb();
    })
  },
  
  'test result field null number': function(cb) {
    var db = createConnection();
    // first insert a record that we know has a null value
    db.query('INSERT INTO tbl SET parent = NULL').addListener('result', function(res) {
      var insert_id = res.insert_id    
      var sql = 'SELECT * FROM tbl WHERE id = ' + insert_id
      db.query(sql).addListener('row', function(r) {
        assert.isNull(r.parent)
      })
    }).addListener('end', function() {
      db.close()
      cb();
    })
  },
  
  'test result field non null number': function(cb) {
    var db = createConnection();
    // first insert a record that we know has a null value
    db.query('INSERT INTO tbl SET parent = 1').addListener('end', function() {
      var insert_id = this.result.insert_id

      var sql = 'SELECT * FROM tbl WHERE id = ' + insert_id
      db.query(sql).addListener('row', function(r) {
        assert.eql(r.parent, 1)
      })
      
    }).addListener('end', function() {
      db.close();
      cb();
    })
  }
}
