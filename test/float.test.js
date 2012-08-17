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
    '#69 test reading float in non-zero position': function(params) {
        var setupSql = 'CREATE TEMPORARY TABLE test_flt (\
            id bigint(11) unsigned NOT NULL AUTO_INCREMENT, \
            a float unsigned NULL, \
            PRIMARY KEY (id) \
            )';
        var insertSql = 'INSERT INTO test_flt (a) VALUES (?)';
        var testSql = 'SELECT id, a FROM test_flt';

        var testFlt = 123.456;

        runTest(params, setupSql, insertSql, [testFlt], testSql, [], function(r){
            //console.log('r', r);
            assert.ok(r[1] > testFlt - 0.00001);
            assert.ok(r[1] < testFlt + 0.00001);
        }, params);    
     }
}

