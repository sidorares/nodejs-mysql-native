var cmd = require('./command')

module.exports = function(msg)
{
     var c = new cmd(
        {
            start: function()
            {
                console.puts(msg);
                return 'done';
            }
        }
     );
    c.trace = new Error().trace;
    return c;
}
