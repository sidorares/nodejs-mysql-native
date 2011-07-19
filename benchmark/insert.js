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
//client.verbose = true;
//client.query(config.drop);
client.query(config.create_table)
  .on('end',
     function() {
       console.log('starting benchmark');
       var start = +new Date, queries = 0, total = 10000;
       var rowcount = 0;
       var startTick = +new Date;

       function queryOne() {
         client.query('select * from nodebench_test_table')
            .on('row', function(r) { 
              //console.log(r); 
              rowcount++;
            })
            .on('end', function() {
              //dumpMem(queries);
              queries++;
              if (queries < total) {
                process.nextTick(function() { queryOne() });
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
                
                console.log(rowcount);
		var rps = rowcount/duration;
                rowcount = 0;             
                console.log('%d queries / second, %d rps', queriesPerSecond.toFixed(2), rps.toFixed(2));
              }
           });
     }
     queryOne();
  });
