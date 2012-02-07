var writer = require('../serializers/writer');
var field_flags = require('../constants').field_flags;
var flags = require('../constants').flags;
var types = require('../constants').types;
var pack = require('../pack');
var cmd = require('../command')

module.exports = function()
{
   return new cmd(
       {
          start: function()
          {
              // TODO: send COM_CLOSE packet
              this.connection.end();
              return 'done';
          }
      }
   );
}
