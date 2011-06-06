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
      
      var insert_id = this.result.insert_id;
      assert.ok(insert_id >= 0)

      sql = 'SELECT id,field FROM tbl WHERE id = ' + insert_id;
      db.query(sql).addListener('row', function(r) {
          var row = r;
          assert.equal( row.id, insert_id );
          assert.equal( row.field, "this is' a test\" 'quoted' string\nwith multiple\nlines" );
      }).addListener('end', function() {
          db.close()
      })
    })
    
  },
  
  'test insert multibyte characters': function() {
    
    var db = mysql.createTCPClient()
    db.set('auto_prepare', true)
      .set('charset', 'utf8') // to specify charset
      .auth("test", "testuser", "testpass")

    var sql = 'INSERT INTO tbl SET id = NULL, field = ' + db.quote("本日は晴天なり")
    db.query(sql).addListener('end', function() {
    
      var insert_id = this.result.insert_id;

      assert.ok(insert_id >= 0)

      sql = 'SELECT id,field FROM tbl WHERE id = ' + insert_id;

      db.query(sql).addListener('row', function(row) {
          assert.equal( row.id, insert_id );
          assert.equal( row.field, "本日は晴天なり" );
      }).addListener('end', function() {
          db.close()
      })
    
    })
    
  }
}
