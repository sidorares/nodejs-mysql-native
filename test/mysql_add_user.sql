CREATE USER 'tester'@'%' IDENTIFIED BY 'testpass';
GRANT ALL PRIVILEGES ON *.* TO 'tester'@'%' WITH GRANT OPTION;
create database if not exists test;