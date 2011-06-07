var assert = require('assert'), 
mysql = require('../lib/mysql-native');

function createConnection()     
{
    var db = mysql.createTCPClient(); 
    //db.verbose = true;
    db.set('auto_prepare', true)
      .set('row_as_hash', false)
      .auth("test", "testuser", "testpass");
    return db;
}

module.exports = {
    'test execute and autoprepare': function(fn) {
        var db = createConnection();
        var end_count = 0; // issue #16 - end emitted twice
        var q = 'select 1+?';   
        db.execute(q, [345])
           .on('end', function()
           {
              end_count++;
           })
           .on('row', function(r)
           {
              assert.equal(r[0], 346);
           });

        // since we test end event we cannot use it to close connection
        setTimeout(function() {
           assert.equal(end_count, 1, 'end event expected to fire exactly one time');
           var ps = db.connection.pscache[q];
           assert.equal(false, !ps, 'expecting cached statement');
           db.close(); 
           if (fn)
              fn();
        }, 200); 
            
     },
     ' #17 issue test ': function(fn)
     {
        var db = createConnection();
        db.prepare('SELECT ?').on('prepared', function() {
           db.execute('SELECT ?', [1]).on('row', function(row) {
              assert.equal(1, row[0]);
           }).on('end', function(cmd) {
              db.close();
              fn();
           });
        });
     }
}
//exports['test execute and autoprepare']();
