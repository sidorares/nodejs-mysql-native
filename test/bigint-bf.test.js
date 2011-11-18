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
    'test large integers': function(params) {
        var setupSql = 'CREATE TEMPORARY TABLE test_int (\
            id bigint(11) unsigned NOT NULL AUTO_INCREMENT, \
            a bigint(11) unsigned NULL, \
            PRIMARY KEY (id) \
            )';
        var insertSql = 'INSERT INTO test_int (a) VALUES (?)';
        var testSql = 'SELECT a FROM test_int';

        var testInt = 13109526528;

        runTest(params, setupSql, insertSql, [testInt], testSql, [], function(r){
            assert.equal(r[0],testInt);
        }, params);    
     },

    'test bit fields': function(params) {
        var setupSql = 'CREATE TEMPORARY TABLE test_bf (\
            id int(11) unsigned NOT NULL AUTO_INCREMENT, \
            a BIT(4) NULL, \
            PRIMARY KEY (id) \
            )';
        var insertSql = "INSERT INTO test_bf (a) VALUES (?)";
        var testSql = 'SELECT a FROM test_bf';

        var bitField = [false, true];
        runTest(params, setupSql, insertSql, [bitField], testSql, [], function(r){
            if(r[0] instanceof Array){
                assert.deepEqual(r[0], bitField);
            } else {
                assert.equal(r[0],bitField);
            }
        }, params);
    }
}

//exports['test large integers']();
//exports['test bit fields']();
