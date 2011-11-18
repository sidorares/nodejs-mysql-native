CREATE USER 'tester'@'%' IDENTIFIED BY 'testpass';
GRANT ALL PRIVILEGES ON *.* TO 'tester'@'%' WITH GRANT OPTION;
create database if not exists test;
use test;
create table test1(f1 int);
insert into test1 values(1);
insert into test1 values(2);
insert into test1 values(3);

create table tbl(id int, parent int, field char(200));