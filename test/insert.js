var test=require('./insert.test.js');
var mysql=require('./common.js');
var db=mysql.createConnection();

test['test insert quoted']();
test['test insert quoted multiline']();
test['test insert multibyte characters']();
test['test insert multibyte using execute']();

setTimeout(function(){
    db.query("select * from tbl").on('row',function(r){
        console.log(r);
    });
},3000);

setTimeout(function(){
    process.exit(0);
},4500);
