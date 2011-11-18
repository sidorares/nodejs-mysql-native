var assert = require('assert');
var createConnection = require('./common').createConnection;

module.exports = {
  
  'test insert quoted': function(cb) {
    var db = createConnection();    
    var sql = 'INSERT INTO tbl SET id = NULL, field = ' + db.quote("this is' a test\" 'quoted' string");
    db.query(sql).on('row', function(r) {

    }).on('end', function() {
      db.close();
      if(cb)
        cb();
    })
    
  },
  
  'test insert quoted multiline': function(cb) {
    
    var db = createConnection();    
    var sql = 'INSERT INTO tbl SET id = NULL, field = ' + db.quote("this is' a test\" 'quoted' string\nwith multiple\nlines")
    db.query(sql).on('result', function(r) {
      
      var insert_id = this.result.insert_id;
      assert.ok(insert_id >= 0)

      sql = 'SELECT id,field FROM tbl WHERE id = ' + insert_id;
      db.query(sql).on('row', function(r) {
          var row = r;
          assert.equal( row.id, insert_id );
          assert.equal( row.field, "this is' a test\" 'quoted' string\nwith multiple\nlines" );
      }).on('end', function() {
          db.close()
          if(cb)
              cb();
      })
    })
    
  },
  
  'test insert multibyte characters': function(cb) {
    
    var db = createConnection();
    var sql = 'INSERT INTO tbl SET id = NULL, field = ' + db.quote("本日は晴天なり");
    db.query(sql).on('end', function() {
    
      var insert_id = this.result.insert_id;

      assert.ok(insert_id >= 0)

      sql = 'SELECT id,field FROM tbl WHERE id = ' + insert_id;

      db.query(sql).on('row', function(row) {
          assert.equal( row.id, insert_id );
          assert.equal( row.field, "本日は晴天なり" );
      }).on('end', function() {
          db.close();
          if(cb)
              cb();
      })
    
    })
    
  }
}
