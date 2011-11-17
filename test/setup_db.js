var assert = require('assert')
var mysql = require('../lib/mysql-native')

var db = mysql.createTCPClient();
db.auth();
db.query('create database test').on('end', function() {
    db.close();
});