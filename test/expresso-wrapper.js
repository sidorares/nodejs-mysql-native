// TODO: check if expresso installed, use wrapper if not
var fs=require('fs');
var assert = require('assert');

var files = fs.readdirSync(__dirname).map(function(file){
   if (file.match('.test.js'))
       return './' + file.substr(0,file.length - 3);
}).filter(function(f) { return f; });

var num_passed = 0;
var failed_list = [];

function runModuleTests(m, cb)
{
      var tests = Object.keys(m);
      var subtest = -1;
      var runOne = function()
      {
          subtest++;
          if (subtest < tests.length)
          {
             console.log(" starting " + tests[subtest]);
             try {
                 m[tests[subtest]](runOne);

             } catch(err)
             {
                 throw(err);
                 console.error(err.message);
                 runOne();
             }
          } else {
              cb();
          }
      }
      runOne();    
}

function runTest(name, cb)
{
   try {   
      var m = require(name);
      runModuleTests(m, cb);
   } catch(e) {      
      console.log('Error from ' + name + ': ' + e.message);
      throw e;
   }
}

var test_num = -1;
function runAll()
{
    test_num++;
    if (files.length >= test_num+1)
    {
        runTest(files[test_num], runAll);
    };
}

runAll();