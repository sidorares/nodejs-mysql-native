// original benchmark code from @felixge mysql driver
// https://github.com/felixge/node-mysql/blob/master/benchmark/node-mysql/insert.js
// see https://github.com/felixge/node-mysql/blob/master/License

var queries = require('./fixtures/queries');
var client = require('../lib/mysql-native').createTCPClient('127.0.0.1'); // FIXME: localhost doesen't work on windows port
// TODO: change auth signature to use struct as parameter. Too easy to misplace arguments
client.auth('', 'root', '')

client.query(queries.createdb);
client.query(queries.use);
client.query(queries.drop);
client.query(queries.create_table)
  .on('end',
     function() {
       console.log('starting benchmark');
       var start = +new Date, inserts = 0, total = 10000;
       function insertOne() {
         client.query(queries.insert)
            .on('end', function() {
              inserts++;
              if (inserts < total) {
                insertOne(inserts);
              } else {
                var duration = (+new Date - start) / 1000,
                    insertsPerSecond = inserts / duration;

                console.log('%d inserts / second', insertsPerSecond.toFixed(2));
                console.log('%d ms', +new Date - start);
                client.end();
              }
           });
     }
     insertOne();
  });
