var cmd = require('./command')

module.exports = function()
{
   return new cmd(
       {
          start: function()
          {
              this.connection.terminate();
              return 'done';
          }
      }
   );
}
