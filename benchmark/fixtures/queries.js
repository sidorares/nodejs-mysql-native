var conf = require('./config');

// TODO: add code to read all *.sql files to help author large queries
module.exports = {
    createdb: 'create database ' + conf.db,
    use: 'use ' + conf.db,
    drop: 'DROP TABLE IF EXISTS '+ conf.table,
    create_table:   'CREATE TABLE ' + conf.table + ' ('+
      'id INT(11) AUTO_INCREMENT, '+
      'title VARCHAR(255), '+
      'text TEXT, '+
      'created DATETIME, '+
      'PRIMARY KEY (id));',
    insert: 'INSERT INTO ' + conf.table + ' SET title = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"',
    insert_param: 'INSERT INTO ' + conf.table + ' SET title = "?"'
}