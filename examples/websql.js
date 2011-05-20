// websql example adapted from  http://html5demos.com/database-rollback
// original code (c) 

var webdb = require('../lib/mysql-native/websql');

var db = webdb.openDatabase('test');
db.transaction(function (tx) {
  tx.executeSql("CREATE TABLE `foo` (`id` int(20) DEFAULT NULL, `text` blob ) ENGINE=InnoDB");  
  tx.executeSql('INSERT INTO foo (id, text) VALUES (1, "foobar")');
});

db.transaction(function (tx) {
  tx.executeSql('SELECT * FROM foo', [], function (tx, results) {
    console.log('found rows (should be 1): ' + sys.inspect(results)); 
  }, function (tx, err) {
    console.log('select* failed: ' + err.message);
  });
});

db.transaction(function (tx) {
  tx.executeSql('DROP TABLE foo');
  // known to fail - so should rollback the DROP statement
  tx.executeSql('INSERT INTO foo (id, text) VALUES (1, "foobar")', [], 
  function(tx, rs)
  {
      console.log("insrted " + sys.inspect(rs));
  });
}, function (err) {
  sys.puts('should be rolling back caused by: ' + err.message);
});

db.transaction(function (tx) {
  tx.executeSql('SELECT * FROM foo', [], function (tx, results) {
    console.log('found rows (should be 1): ' + sys.inspect(results)); 
  }, function (tx, err) {
    console.log('select* failed: ' + err.message);
  });
});
