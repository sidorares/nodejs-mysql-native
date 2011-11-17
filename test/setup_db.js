var assert = require('assert')
var mysql = require('../lib/mysql-native')

var db = mysql.createClient();
db.query('create database test').on('end', function() {
    db.close();
});