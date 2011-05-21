var cmd = require('../command')

module.exports = function(message)
{
  var res = new cmd(
      {
         start: function()
         {
             var delta = +new Date() - this.startTime;
             console.log('(' + delta + ') ' + message);
             return 'done';
         }
     }
  );
  res.startTime = +new Date();
  return res;
}
