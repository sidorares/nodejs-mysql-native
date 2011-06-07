var
  util = require('util')
  , assert = require('assert')
  , mysql = require('../lib/mysql-native')


//
//  parts of code from expresso
//  TODO: move to wrapper
// 
assert.eql = assert.deepEqual;

assert.isNull = function(val, msg) {
    assert.strictEqual(null, val, msg);
};

assert.includes = function(obj, val, msg) {
    msg = msg || util.inspect(obj) + ' does not include ' + util.inspect(val);
    assert.ok(obj.indexOf(val) >= 0, msg);
};

assert.length = function(val, n, msg) {
    msg = msg || util.inspect(val) + ' has length of ' + val.length + ', expected ' + n;
    assert.equal(n, val.length, msg);
};

function createClient()
{
    var db = mysql.createTCPClient();
    db.set('charset', 'utf8');
    db.auth('test', 'testuser', 'testpass');
    // TODO: add create database test; use test
    db.query('create temporary table tbl(id int, field varchar(255))');
    db.set('row_as_hash', false);
    return db;
}

module.exports = {
  
  'test autoprepare': function(cb) {
    
    var db = createClient();   
    var sql = 'SELECT * FROM tbl WHERE id = ?'
    db.execute(sql, [1]).addListener('row', function(r) {
      assert.isDefined(r.id)
    }).addListener('end', function() {
      db.close();
      cb();
    })
    
  },
  
  'test prepare params': function(cb) {

    var db = createClient();         
    var params = ['param', 'param2', 'param3']
    db.execute("select ?,?,?", params).addListener('row', function(r) {
      assert.includes(r, 'param')
      assert.length(r, 3)
    }).addListener('end', function() {
      db.close();
      cb();
    })
  },
  
  'test prepare null params': function(cb) {

    var db = createClient();        
    var params = [null, null, null]

    db.execute("select ?,?,?", params).addListener('row', function(r) {
      assert.includes(r, null)
      assert.length(r, 3)
    }).addListener('end', function() {
      db.close();
      cb();
    })
    
  },
  
  'test prepare undefined params': function(cb) {

    var db = createClient();   
    var params = [undefined, undefined, undefined]

    db.execute("select ?,?,?", params).addListener('row', function(r) {
      assert.includes(r, null)
      assert.length(r, 3)
    }).addListener('end', function() {
      db.close();
      cb();
    })
    
  },
  
  'test prepare mixed params': function(cb) {

    var db = createClient();         
    var params = [null, 'param2', undefined]

    db.execute("select ?,?,?", params).addListener('row', function(r) {
      assert.isNull(r[0], null)
      assert.eql(r[1], 'param2')
      assert.eql(r[2], null)
      assert.length(r, 3)
    }).addListener('end', function() {
      db.close();
      cb();
    })
    
  },
  
  'test execute result complete': function(cb) {

    var db = createClient();   
    db.execute("select ?,?,?", [ 'test', null, 1]).addListener('result', function(res) {
      assert.length(res.rows, 1)
    }).addListener('end', function() {
      db.close();
      cb();
    })
  }
}