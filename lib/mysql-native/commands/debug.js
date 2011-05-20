var cmd = require('../command')

module.exports = function(message)
{
  var startTime = +new Date();
  return new cmd(
      {
         start: function()
         {
             var delta = +new Date() - startTime;
             console.log('(' + delta + ') ' + message);
             return 'done';
         }
     }
  );
}
