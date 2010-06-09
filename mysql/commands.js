var sha1 = require('sha1').SHA1;
var sys = require('sys');
var writer = require('./serializers').writer;
var flags = require('./constants').flags;
var types = require('./constants').types;

function xor(s1, s2)
{
    var res = "";
    for (var i=0; i < 20; ++i)
    {
        var c1 = s1.charCodeAt(i);
        var c2 = s2.charCodeAt(i);
        res += String.fromCharCode( s1.charCodeAt(i) ^ s2.charCodeAt(i) );
    }
    return res;
}

function parseTime(s)
{
    // TODO: add real parsing
    return new Date();
}

function parseString(s)
{
    return s;
}

function parseNull(s)
{
    return null;
}

var type_parsers = {};
  type_parsers[types.MYSQL_TYPE_DECIMAL] =  parseInt;
  type_parsers[types.MYSQL_TYPE_TINY] = parseInt;
  type_parsers[types.MYSQL_TYPE_SHORT] = parseInt;
  type_parsers[types.MYSQL_TYPE_LONG] = parseInt;
  type_parsers[types.MYSQL_TYPE_FLOAT] = parseFloat;
  type_parsers[types.MYSQL_TYPE_DOUBLE] = parseFloat;
  type_parsers[types.MYSQL_TYPE_NULL] = parseNull,
  type_parsers[types.MYSQL_TYPE_TIMESTAMP] = parseTime,
  type_parsers[types.MYSQL_TYPE_LONGLONG] = parseInt;
  type_parsers[types.MYSQL_TYPE_INT24] = parseInt;
  type_parsers[types.MYSQL_TYPE_DATE] = parseTime,
  type_parsers[types.MYSQL_TYPE_TIME] = parseTime,
  type_parsers[types.MYSQL_TYPE_DATETIME] = parseTime,
  type_parsers[types.MYSQL_TYPE_YEAR] = parseTime,
  type_parsers[types.MYSQL_TYPE_NEWDATE] = parseTime,
  type_parsers[types.MYSQL_TYPE_VARCHAR] = parseString;
  //MYSQL_TYPE_BIT: ,
  //MYSQL_TYPE_NEWDECIMAL: 246,
  //MYSQL_TYPE_ENUM: 247,
  //MYSQL_TYPE_SET: 248,
  type_parsers[types.MYSQL_TYPE_TINY_BLOB] = parseString;
  type_parsers[types.MYSQL_TYPE_MEDIUM_BLOB] = parseString;
  type_parsers[types.MYSQL_TYPE_LONG_BLOB] = parseString;
  type_parsers[types.MYSQL_TYPE_BLOB] = parseString;
  type_parsers[types.MYSQL_TYPE_VAR_STRING] = parseString;
  type_parsers[types.MYSQL_TYPE_STRING] = parseString;
  //MYSQL_TYPE_GEOMETRY: 255G

var string2type = function(str, t)
{
    return type_parsers[t](str);
}



var mysql_type = function(js_type)
{
}

//
// mysql 4.2+ authorisation protocol
// token = sha1(salt + sha1(sha1(password))) xor sha1(password)
//
function scramble(password, salt)
{
    var stage1 = sha1(password);
    var stage2 = sha1(stage1);
    var stage3 = sha1(salt + stage2);
    return xor(stage3, stage1);
}


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
        this[h] = handlers[h];
    }    

    // delegate to private EventEmitter member
    this.emit = function()
    {
       ee.emit.apply(ee, arguments);
    }
    this.addListener = function()
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

        var next_state = this[this.state].apply(this, arguments);
        if (next_state)
        {
            this.state = next_state;
        }
        if (this.state == "done")
        {
           ee.emit(this.state, this);
           return true;
        }
        if (this.state == "error")
           return true;
        return false;
    }

    this.write = function(packet)
    {
        this.connection.write_packet(packet);    
    }
} 

function auth(db, user, password)
{
    var c = new cmd( 
    {
        start: function() { return 'read_status'; },
        read_status: function( r )
        {
            c.serverStatus.protocolVersion = r.bytes(1);
            c.serverStatus.serverVersion = r.zstring();
            c.serverStatus.threadId = r.bytes(4);
            var salt = r.bytes(8);
            // TODO: whats this? comment and add fields o sercerStatus
            r.bytes(1);
            r.bytes(5);
            r.bytes(1);
            r.bytes(12);
            salt += r.bytes(12);

            var token = scramble(password, salt);
            var reply = new writer();
            var client_flags = flags.CLIENT_BASIC_FLAGS;
            reply.add(client_flags);
            reply.add(0x01000000);        //max packet length
            reply.add("\u0008");          //charset
            var filler = ""; for (var i=0; i < 23; ++i) filler += "\u0000";
            reply.add(filler);
            reply.zstring(user);
            reply.lcstring(token);
            reply.zstring(db);
            this.connection.write_packet(reply, 1);
            return 'check_auth_ok';
        },
        check_auth_ok: function( r ) 
        {
            var ok = r.readOKpacket();
            this.emit('connected', c.serverStatus);
            return 'done'; 
        }        
    });
    c.state = 'start';
    c.serverStatus = {};
    return c;
}

function query(sql)
{
    return new cmd(
    {
        start: function()
        {
            this.write( new writer().add("\u0003").add(sql) );
            return 'rs_ok';
        },
        rs_ok: function( r )
        {
            var ok = r.readOKpacket();
            if (ok.field_count == 0)
                return 'done';
            //sys.puts("rs_ok: " + sys.inspect(ok));
            this.fields = [];
            return 'handle_fields';
        },
        handle_fields: function( r )
        {
            if (r.isEOFpacket())
            {
                this.emit('fields_eof');
                return 'data';
            }
            var f = r.field();
            this.emit('field', f);
            this.fields.push(f);
        },
        data: function( r )
        {
            if (r.isEOFpacket())
                return 'done';
            var row = [];
            var field_index = 0;
            while (!r.eof())
            {
                var field = this.fields[field_index];
                var value = r.lcstring();
                row.push(string2type(value, field.type));
                field_index++;
            }
            this.emit('row', row, this.fields);
        }
    });
}

function prepare(sql)
{
    return new cmd(
    {
        start: function()
        {
           this.write( new writer().add("\u0016").add(sql) );
           sys.puts( "psok sent" );
           return 'ps_ok';
        },
        ps_ok: function( r )
        {
           this.ps = {};
           var ok = r.bytes(1);
           this.ps.statement_handler_id = r.num(4);
           this.ps.field_count = r.num(2);
           this.ps.num_params = r.num(2);
           r.bytes(1); // filler, should be 0
           if (!this.connection.pscache)
               this.connection.pscache = {};
           this.connection.pscache[sql] = this.ps;
           this.emit('prepared', this.ps);
           this.ps.fields = [];
           this.ps.parameters = [];
           if (this.ps.num_params > 0)
               return 'params';
           if (this.ps.field_count == 0)
               return 'done';
           return 'fields';
        },
        params: function( r )
        {
            if (r.isEOFpacket())
            {
                 if (this.ps.field_count == 0)
                      return 'done';
                 return 'fields';
            }
            //var p = r.parameter();
            var p = r.field();
            this.ps.parameters.push(p);
        },
        fields: function( r )
        {
            if (r.isEOFpacket())
            {
                return 'done';
            }
            var f = r.field();
            this.ps.fields.push(f);
            this.emit('field', f);
        }        
    }

    );
}

function execute(sql, parameters)
{
    var ps;
    return new cmd(
    {
        start: function()
        {
           if (this.connection.pscache)
               this.ps = this.connection.pscache[sql];
           if (!this.ps)
           {
               var error = { message: 'Prepared statement \"' + sql + '\" not found', errno: 0 };
               this.emit('error', error);
               return 'done';
           }
           sys.p(this.ps);
           var packet = new writer().add("\u0017").add(this.ps.statement_handler_id).add("\u0000\u0001\u0000\u0000\u0000");
           if ( parameters )
           {
               var null_bit_map = "";
               var mask = 1;        
               var bit_map = 0;        
               for (var p=0; p < parameters.lengt; ++p)
               {
                   if (parameters[p] == null)
                       bit_map += mask;
                   mask = mask*2;
                   if (mask == 256)
                   {
                       null_bit_map.push(String.fromCharCode(bit_map));
                       mask = 1;
                       bit_map = 0;
                   }
               }
               packet.add(null_bit_map);
               packet.add(1);
               var types = "";
               
                         
           }
           this.write( packet ); 
           return 'fields';
        },
        fields: function( r )
        {
            if (r.isEOFpacket())
            {
                return 'binrow';
            }
            var f = r.field();
            this.emit('field', f);
        },
        binrow: function( r )
        {
            if (r.isEOFpacket())
               return 'done';
            this.emit('binrow', r);
        }

    });
}

function close()
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

function debug( text )
{
   return new cmd(
       {
          start: function()
          {
              sys.puts(text);
              return 'done';
          }
      }
   );
}

exports.auth = auth;
exports.close = close;
exports.query = query;
exports.prepare = prepare;
exports.execute = execute;
exports.debug = debug;
