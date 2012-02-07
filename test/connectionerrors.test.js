var assert = require('assert');
var createConnection = require('./common').createConnection;
var net = require('net');

/*
module.exports = {
  'test connection closed during query': function(cb) {
       var forwardport = 3500;
       
       var s = net.createServer(function(cli) {
           var my = net.createConnection(3306);
           cli.pipe(my);
           my.pipe(cli);
          
           setTimeout(function() {
               my.end();
               cli.end();
           }, 1000); // close port forwarding in 1 second
       }).listen(forwardport);

       var db = createConnection({port: forwardport});
       db.query('select sleep(3)')       // take approx 3 seconds to execute
           .on('error', function(e) {
                console.log('command 1 error handler');
                console.log(e);
                cb();
           }).on('end', function() {
                console.log('command 1 finished');
           });

      // start new command after connection is closed
      setTimeout(function() {
           console.log('sending  second query');
           db.query('select 1') 
               .on('error', function(e) {
                    console.log('command 2 error handler');
                    console.log(e);
                    cb();
               }).on('end', function() {
                    console.log('command 2 finished');
               });
    	   
      }, 1500);  
  }
}



*/