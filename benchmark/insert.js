// original benchmark code from @felixge mysql driver
// https://github.com/felixge/node-mysql/blob/master/benchmark/node-mysql/insert.js
// see https://github.com/felixge/node-mysql/blob/master/License

var config = require('./fixtures/queries');
var client = require('../lib/mysql-native').createTCPClient('127.0.0.1'); // FIXME: localhost doesen't work on windows port
// TODO: change auth signature to use struct as parameter. Too easy to misplace arguments

var startUsage = process.memoryUsage();

function dumpMem(n)
{
    var memusage = process.memoryUsage();
    console.log(n + ' rss: ' + (memusage.rss - startUsage.rss) + '  vsize:'  + (memusage.vsize - startUsage.vsize) + 
       ' heapTotal:' + (memusage.heapTotal - startUsage.heapTotal) + '  heapUsed:'  + (memusage.heapUsed - startUsage.heapUsed)
   );
}

client.auth('', 'root', '')

client.query(config.createdb);
client.query(config.use);
client.verbose = true;
//client.query(config.drop);
client.query(config.create_table)
  .on('end',
     function() {
       console.log('starting benchmark');
       var start = +new Date, queries = 0, total = 1;
       var startTick = +new Date;

       function queryOne() {
         client.debug(queries);
         client.query(config.call)
            .on('row', function(r) { console.log(r); })
            .on('end', function() {
              //dumpMem(queries);
              queries++;
              if (queries < total) {
                process.nextTick(function() { queryOne(queries) });
              } else {
                var duration = (+new Date - start) / 1000,
                    queriesPerSecond = queries / duration;

                console.log('%d queries / second', queriesPerSecond.toFixed(2));
                console.log('%d ms', +new Date - start);
                client.end();
              }
              if (queries % 100 == 0)
              {
                var duration = (+new Date - startTick) / 1000,
                    queriesPerSecond = 100 / duration;
		startTick = +new Date;                

                console.log('%d queries / second', queriesPerSecond.toFixed(2));
              }
           });
        client.debug(queries + 'finished');
 
     }
     queryOne();
  });
