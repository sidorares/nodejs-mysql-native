var tcp = require("tcp");
var sys = require("sys");
var sha1 = require("sha1").SHA1;

var flags = exports.flags = 
{
  CLIENT_LONG_PASSWORD:	1	,/* new more secure passwords */
  CLIENT_FOUND_ROWS:	2	,/* Found instead of affected rows */
  CLIENT_LONG_FLAG:	4	,/* Get all column flags */
  CLIENT_CONNECT_WITH_DB:	8	,/* One can specify db on connect */
  CLIENT_NO_SCHEMA:	16	,/* Don't allow database.table.column */
  CLIENT_COMPRESS:		32	,/* Can use compression protocol */
  CLIENT_ODBC:		64	,/* Odbc client */
  CLIENT_LOCAL_FILES:	128	,/* Can use LOAD DATA LOCAL */
  CLIENT_IGNORE_SPACE:	256	,/* Ignore spaces before '(' */
  CLIENT_PROTOCOL_41:	512	,/* New 4.1 protocol */
  CLIENT_INTERACTIVE:	1024	,/* This is an interactive client */
  CLIENT_SSL:              2048	,/* Switch to SSL after handshake */
  CLIENT_IGNORE_SIGPIPE:   4096    ,/* IGNORE sigpipes */
  CLIENT_TRANSACTIONS:	8192	,/* Client knows about transactions */
  CLIENT_RESERVED:         16384   ,/* Old flag for 4.1 protocol  */
  CLIENT_SECURE_CONNECTION: 32768  ,/* New 4.1 authentication */
  CLIENT_MULTI_STATEMENTS: 65536   ,/* Enable/disable multi-stmt support */
  CLIENT_MULTI_RESULTS:    131072  /* Enable/disable multi-results */
}

var CLIENT_BASIC_FLAGS = flags.CLIENT_LONG_PASSWORD | 
                       flags.CLIENT_FOUND_ROWS | 
                       flags.CLIENT_LONG_FLAG | 
                       flags.CLIENT_CONNECT_WITH_DB | 
                       flags.CLIENT_NO_SCHEMA | 
                       flags.CLIENT_ODBC | 
                       flags.CLIENT_LOCAL_FILES | 
                       flags.CLIENT_IGNORE_SPACE | 
                       flags.CLIENT_PROTOCOL_41 | 
                       flags.CLIENT_INTERACTIVE |
                       flags.CLIENT_IGNORE_SIGPIPE | 
                       flags.CLIENT_TRANSACTIONS | 
                       flags.CLIENT_RESERVED | 
                       flags.CLIENT_SECURE_CONNECTION | 
                       flags.CLIENT_MULTI_STATEMENTS | 
                       flags.CLIENT_MULTI_RESULTS;  

function writer()
{
   this.data = "";
}

writer.prototype.zstring = function(s)
{
   this.data += s + "\u0000";
}

//
//  length-coded number
//
//  Value Of     # Of Bytes  Description
//  First Byte   Following
//  ----------   ----------- -----------
//  0-250        0           = value of first byte
//  251          0           column value = NULL
//                           only appropriate in a Row Data Packet
//  252          2           = value of following 16-bit word
//  253          3           = value of following 24-bit word
//  254          8           = value of following 64-bit word
//
writer.prototype.lcnum = function(n)
{
   if (n < 251)
       this.data += String.fromCharCode(n);
   else if (n < 0xffff)
   {
       this.data += String.fromCharCode(252);
       this.data += String.fromCharCode( n & 0xff );
       this.data += String.fromCharCode( (n >> 8) & 0xff );
   } else if (n < 0xffffff)
   {
       this.data += String.fromCharCode(253);
       this.data += String.fromCharCode( n & 0xff );
       this.data += String.fromCharCode( (n >> 8) & 0xff );
       this.data += String.fromCharCode( (n >> 16) & 0xff );
   } 
   /*
      TODO: 64 bit number
   */
}

//
// write length-coded string to the buffer
//
writer.prototype.lcstring = function(s)
{
   this.lcnum(s.length);
   this.data += s;
}

writer.prototype.add = function(s)
{
   if (typeof s == "string")
       this.data += s;
   else if (typeof s == "number")
   {
       this.data += String.fromCharCode( s & 0xff );
       this.data += String.fromCharCode( (s >> 8)  & 0xff );
       this.data += String.fromCharCode( (s >> 16) & 0xff );
       this.data += String.fromCharCode( (s >> 24) & 0xff );
   }
}

writer.prototype.addPacketHeader = function(h)
{
    var length = this.data.length;
    var header = "";
    header += String.fromCharCode( length     & 0xff );
    header += String.fromCharCode( length>>8  & 0xff );
    header += String.fromCharCode( length>>16 & 0xff );
    header += String.fromCharCode( h.packetNum );
    this.data = header + this.data;
}

function reader(data)
{
   this.data = data;
   this.pos = 0;

}

reader.prototype.num = function(numbytes)
{
    var res = 0;
    var factor = 1;
    for (var i=0; i < numbytes; ++i)
    {
        res += this.data.charCodeAt(this.pos) * factor;
        factor = factor << 8;
        this.pos++;
    }
    return res;
}

reader.prototype.zstring = function()
{
   var res = "";
   var c;
   while(c = this.data.charCodeAt(this.pos++))
   {
       res += String.fromCharCode(c);
   }
   return res;
}

reader.prototype.lcstring = function()
{
    var len = this.lcnum();
    var res = this.bytes(len);
    //dump(this.data);
    //sys.puts("pos:" + this.pos);
    return res;
}

reader.prototype.eof = function()
{
    return this.pos >= this.data.length;
}

reader.prototype.readOKpacket = function()
{
   var res = {};
   res.field_count = this.data.charCodeAt(this.pos++);
   if (res.field_count == 0xff) // error
   {
       res.errno = this.data.charCodeAt(this.pos) + (this.data.charCodeAt(this.pos+1)<<8);
       this.pos += 2;
       this.pos++; // skip sqlstate marker, "#"
       res.sqlstate = this.bytes(5);
   } else {
       res.affected_rows = this.lcnum();
       res.insert_id = this.lcnum();
       res.server_status = this.data.charCodeAt(this.pos) + (this.data.charCodeAt(this.pos+1)<<8);
       this.pos += 2;
       res.warning_count = this.data.charCodeAt(this.pos) + (this.data.charCodeAt(this.pos+1)<<8);
       this.pos += 2;
   }
   // message is the date until the end of the packet
   res.message = this.data.substr(this.pos, this.data.length - this.pos);
   return res;
}

reader.prototype.lcnum = function()
{
   var b1 = this.data.charCodeAt(this.pos);
   this.pos++;
   return b1;
}

reader.prototype.readPacketHeader = function()
{
   var res = { length: 0, packetNum:0 };
   res.length += this.data.charCodeAt(0);
   res.length += this.data.charCodeAt(1) << 8;
   res.length += this.data.charCodeAt(2) << 16;
   res.packetNum = this.data.charCodeAt(3);
   this.pos += 4;
   return res;
}

reader.prototype.bytes = function(n)
{
   var res = "";
   var end = this.pos+n;
   while(this.pos < end)
   {
       res += this.data.charAt(this.pos);
       this.pos++;
   }
   return res;
}

function xor(s1, s2)
{
    //sys.puts("xor s1:");
    //sys.p(s1);
    //sys.puts("xor s2:");
    //sys.p(s2);
    //sys.p(s1.length);
    //sys.p(s2.length);
    var res = "";
    for (var i=0; i < 20; ++i)
    {
        var c1 = s1.charCodeAt(i);
        var c2 = s2.charCodeAt(i);
        //sys.puts(i.toString() + " " + c1.toString() + " " + c2.toString() + " " + (c1^c2).toString());
        res += String.fromCharCode( s1.charCodeAt(i) ^ s2.charCodeAt(i) );
    }
    return res;
}

function scramble(password, message)
{
    sys.puts("password:" + password);
    sys.puts("message:" + message);
    var stage1 = sha1(password);
    var stage2 = sha1(stage1);
    var stage3 = sha1(message + stage2);
    return xor(stage3, stage1);
}

function dump(d)
{
   for (var i=0; i < d.length; ++i)
   {
       sys.puts(i.toString() + " " + d.charAt(i) + " " + d.charCodeAt(i).toString());
   }
}


function packetLength(data)
{
    var len = data.charCodeAt(0); 
    len += (data.charCodeAt(1) << 8); 
    len += (data.charCodeAt(2) << 16);
    sys.puts("len:" + len);
    return len;
}

function completePacket(data)
{
    var len = data.length;
    if (len < 4)
        return false;
    return length >= packetLength(data); 
}

exports.testMysql = function(host)
{

    var connection = tcp.createConnection(3306, host);
    connection.setEncoding("binary");
    connection.setTimeout(0);
    connection.buffer = "";
    connection.expect = "hello";
    connection.queue = [];
    
    connection.ps = { params: [], columns: []};
    connection.fields = [];    

    connection.addListener("data", 
       function(data)
       {
          connection.buffer += data;
          var len = packetLength(connection.buffer);
          while (connection.buffer.length >= len + 4)
          {
              var packet = connection.buffer.substr(4,len);
              connection.processPacket(packet);
              connection.buffer = connection.buffer.substr(len+4, connection.buffer.length-len-4);
              len = packetLength(connection.buffer);
          }
       }
    );

    connection.processPacket = function(packet)
    {
        var connection = this;
        //dump(packet); 
        sys.puts("packet " + connection.expect);
        //dump(packet);
        var r = new reader(packet);
        if (connection.expect == "hello")
        {
            // read hello data
            var protocolVersion = r.bytes(1);
            var serverVersion = r.zstring();
            sys.puts("server version:" + serverVersion);
            var threadId = r.bytes(4);
            var salt = r.bytes(8);
            r.bytes(1);
            r.bytes(5);
            r.bytes(1);
            r.bytes(12);
            salt += r.bytes(12);
            var password = "testpass";
            var reply = new writer();
            var token = scramble(password, salt);
            var client_flags = CLIENT_BASIC_FLAGS;

            sys.puts("salt:" + salt);
  
            reply.add(client_flags);
            reply.add(0x01000000);        //max packet length
            reply.add("\u0008");          //charset
            var filler = ""; for (var i=0; i < 23; ++i) filler += "\u0000";
            reply.add(filler);
            reply.zstring("testuser");
            reply.lcstring(token);
            reply.zstring("test");
            reply.addPacketHeader({packetNum:1});
            sys.puts("sending data: ");
            connection.expect = "ok";
            dump(reply.data);
            connection.write(reply.data, "binary");
        } else if (connection.expect == "ok")
        {
            // read ok/error packet
            //sys.puts("============");
            //dump(packet);
            var ok = r.readOKpacket(); 
            sys.p(ok);

            var command = new writer();
            command.add("\u0003");
            //command.add("\u0016");
            
            command.add("SELECT * FROM bb");
            //command.add("DESC test.bb");
            //command.add("SELECT 2+?-? as qqq");
            //command.add("select 234,345,456,789 as qqq");
            command.addPacketHeader({packetNum:0});
            connection.fields = [];
            connection.write(command.data, "binary");
            connection.expect = "resultset";
            //connection.expect = "psok";
         } else if (connection.expect == "resultset")
         { 
             if (packet.charCodeAt(0) == 255)
             {
                 var ok = r.readOKpacket(); 
                 sys.p(ok);
                 return;
             }
             sys.puts("RS ============");
             dump(packet);
             connection.fieldcount = r.lcnum();
             connection.fields = [];
             connection.expect = "fields";
         } else if (connection.expect == "fields") {

              if (packet.charCodeAt(0) == 254 && packet.length < 9)
              {
                  sys.puts("fields EOF");
                  return;
              }
 
             var field = {};
             field.catalog = r.lcstring();
             field.db = r.lcstring();
             field.table = r.lcstring();
             field.org_table = r.lcstring();
             field.name = r.lcstring();
             field.org_name = r.lcstring();
                          
             //sys.p(field);

             sys.puts("================");
             if (connection.ps.columns.length < connection.ps.columns_num)
             {
                 connection.ps.columns.push(field);
                  sys.p(connection.ps);
                 return;
             }
             if (connection.ps.params.length < connection.ps.params_num)
             {
                 connection.ps.params.push(field);
                 sys.p(connection.ps);
                 return;
             }
             connection.fields.push(field);
             if (connection.fields.length == connection.fieldcount)
                 connection.expect = "fieldseof"
         } else if (connection.expect == "fieldseof" || connection.expect == "rowseof")
         {
             if (connection.expect == "fieldseof")
             {
                 connection.expect = "rows";
             }
         } else if (connection.expect == "rows") 
         {
              //check it is not eof packet:
              if (packet.charCodeAt(0) == 254 && packet.length < 9)
              {
                  sys.puts("rows EOF");
                  return;
              } 
 
              sys.puts("ROW: ====== ");
              while(!r.eof())
              {
                   var fieldvalue = r.lcstring();
                   sys.puts("field: " + fieldvalue);
              }
         } else if (connection.expect == "psok") 
         {
              var ok = r.bytes(1); // 0
              connection.ps = {};
              connection.ps.columns = []; 
              connection.ps.params = []; 
              var ps = connection.ps;
              ps.statement_handler_id = r.bytes(4);
              ps.columns_num = r.num(2);
              ps.params_num = r.num(2);
              r.bytes(1); // filler
              ps.warning_count = r.num(2);
              sys.p(ps); 
              connection.expect = "fields"
         } else {
              dump(packet);
         }
     }
}
