var mysql = require('../lib/mysql-native')

/*
// temporarily disabled, travis "before_script:" option used instead

var db = mysql.createClient();
db.query('create database if not exists test', function() {
    db.close();
});
*/