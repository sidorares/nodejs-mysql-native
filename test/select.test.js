var createClient = require('./common').createClient;
var assert = require('assert');

module.exports = {


  'test select 1+1 + callback': function(cb) {
      var db = createClient();
      db.query('select 1+1 as qqq', function(err, res) {
      console.log([err, res])
      this.connection.socket.end();
      cb();
    });  
  },
  
  'test select * from test1 + callback': function(cb) {
      var db = createClient();
      db.query('select * from test1', function(err, res) {
      console.log([err, res])
      this.connection.socket.end();
      cb();
    });  
  },


  'test benchmark select 1+1 (10000 queries)': function(cb) {
       var db = createClient();
       var left = 10000;
       var start = +new Date;
       var prev1000 = start;
       function bench()
       {
           db.query('select 1', function(err, res) {
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
                   db.query('select 1', function() { this.connection.socket.end(); });
                   cb();
               }
           });
       }

       bench();
  },
}
