var assert = require('assert');
var createConnection = require('./common').createConnection;

function runTest(params, setupSql, insertSql, insertParams, testSql, testParams, rowTest, cb){
    var db = createConnection();
    db.query(setupSql).on("end", function(){
        db.execute(insertSql, insertParams).on("end", function(){
            db.execute(testSql, testParams)
            .on("row", function(r){
                rowTest(r);
            })
            .on("end", function(){
                db.close();
                if (cb)
                    cb();
            });
        });
    });
}

module.exports = {
    '#68 test reading doubles in non-zero position': function(params) {
        var setupSql = 'CREATE TEMPORARY TABLE test_dbl (\
            id bigint(11) unsigned NOT NULL AUTO_INCREMENT, \
            a double unsigned NULL, \
            PRIMARY KEY (id) \
            )';
        var insertSql = 'INSERT INTO test_dbl (a) VALUES (?)';
        var testSql = 'SELECT id, a FROM test_dbl';

        var testDbl = 1.234;

        runTest(params, setupSql, insertSql, [testDbl], testSql, [], function(r){
            console.log('r', r);
            assert.equal(r[1],testDbl);
        }, params);    
     }
}

