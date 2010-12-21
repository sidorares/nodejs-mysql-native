//
// base for all commands
// initialises EventEmitter and implemets state mashine
//
function cmd(handlers)
{
    var ee = new process.EventEmitter();
    this.state = "start";
    // mixin all handlers  
    for (h in handlers)
    {
        if(handlers.hasOwnProperty(h)) 
        {
            this[h] = handlers[h];
        }
    }    

    // delegate to private EventEmitter member
    this.emit = function()
    {
       ee.emit.apply(ee, arguments);
    }
    this.on = this.addListener = function()
    {
       ee.addListener.apply(ee, arguments);
       return this;
    }

    this.process_packet = function(r)
    {
        if (r && r.isErrorPacket())
        {
            var error = r.readOKpacket();
            ee.emit('error', error);
            return true;
        }
        
        var next_state = (this[this.state]) ? this[this.state].apply(this, arguments) : 'done'
 
        if (next_state)
        {
            this.state = next_state;
        }
        if (this.state == "done")
        {
           ee.emit('end', this);
           return true;
        }
        if (this.state == "error")
           return true;
        return false;
    }

    this.write = function(packet, pnum)
    {
        this.connection.write_packet(packet,pnum);    
    }

    this.store_column = function(r,f,v)
    {
        if (this.connection.row_as_hash)
            r[f.name] = v;
        else
            r.push(v);
    }
}

module.exports = cmd