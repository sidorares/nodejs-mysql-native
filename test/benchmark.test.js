var assert = require('assert');
var createConnection = require('./common').createConnection;

module.exports = {
  'benchmark query (select 1)x10000': function(cb) {
    var db = createConnection();

       var left = 10000;
       var start = +new Date;
       var prev1000 = start;
       function bench()
       {
           db.query('select 1').on('end', function(err, res) {
               left--;
               if (left % 1000 == 0)
               {
                   var curTime = +new Date;
                   var last1000time = curTime - prev1000;
		   prev1000 = curTime;
                   console.log( (1000000/last1000time) + ' req/sec' );
               }

               if (left > 0)
                   bench();
               else {
                   console.log( 10000000/(+new Date() - start) + ' req/sec (average 10000 reqs)');
                   db.close();
                   cb();
               }
           });
       }
       bench();   
  },

  'benchmark execute (select 1+?)x10000': function(cb) {
    var db = createConnection();

       var left = 10000;
       var start = +new Date;
       var prev1000 = start;
       function bench()
       {
           db.execute('select 1+?', [1]).on('end', function() {
               left--;
               if (left % 1000 == 0)
               {
                   var curTime = +new Date;
                   var last1000time = curTime - prev1000;
		   prev1000 = curTime;
                   console.log( (1000000/last1000time) + ' req/sec' );
               }

               if (left > 0)
                   bench();
               else {
                   console.log( 10000000/(+new Date() - start) + ' req/sec (average 10000 reqs)');
                   db.close();
                   cb();
               }
           });
       }
       bench();   
  }

}
