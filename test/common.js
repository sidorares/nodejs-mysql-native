mysql = require('../lib/mysql-native');

module.exports.createConnection = function()     
{
    var db = mysql.createTCPClient(); 
    //db.verbose = true;
    db.set('auto_prepare', true)
      .set('row_as_hash', false)
      .auth('test', 'tester', 'testpass');
    return db;
}
