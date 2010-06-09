var sys = require('sys');
var constants = require('constants');

function writer()
{
   this.data = "";
}

writer.prototype.zstring = function(s)
{
   this.data += s + "\u0000";
   return this;
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
   return this;
}

//
// write length-coded string to the buffer
//
writer.prototype.lcstring = function(s)
{
   this.lcnum(s.length);
   this.data += s;
   return this;
}

writer.prototype.add = function(s)
{
   if (typeof s == "string")      // add string bufer
       this.data += s; 
   else if (typeof s == "number") // add four byte integer
   {
       this.data += String.fromCharCode( s & 0xff );
       this.data += String.fromCharCode( (s >> 8)  & 0xff );
       this.data += String.fromCharCode( (s >> 16) & 0xff );
       this.data += String.fromCharCode( (s >> 24) & 0xff );
   }
   return this;
}

writer.prototype.addHeader = function(n)
{
    var length = this.data.length;
    var header = "";
    header += String.fromCharCode( length     & 0xff );
    header += String.fromCharCode( length>>8  & 0xff );
    header += String.fromCharCode( length>>16 & 0xff );
    var packet_num = n ? n : 0;
    header += String.fromCharCode( packet_num );
    this.data = header + this.data;
    return this;
}

function reader(data)
{
   this.data = data;
   this.pos = 0;

}

// read n-bytes number 
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

reader.prototype.field = function()
{
   var field = {};
   field.catalog = this.lcstring();
   field.db = this.lcstring();
   field.table = this.lcstring();
   field.org_table = this.lcstring();
   field.name = this.lcstring();
   field.org_name = this.lcstring();
   field.filler = this.num(1);
   field.charsetnum = this.num(2);
   field.length = this.num(4);
   field.type = this.num(1);
   field.flags = this.num(2);
   field.decimals = this.num(1);
   field.filler = this.num(2);
   field.defval = this.lcstring();
   // sys.puts("field: " + sys.inspect(field));
   //sys.puts("type:" + constants.type_names[field.type]);
   return field;
}

/*
reader.prototype.parameter = function()
{
    var parameter = {};
    parameter.type = this.num(2);
    parameter.flags = this.num(2);
    parameter.decimals = this.num(1);
    parameter.length = this.num(2);
    return parameter;
}
*/

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
    return res;
}

reader.prototype.isEOFpacket = function()
{
    return this.data.charCodeAt(0) == 254 && this.data.length < 9
}

reader.prototype.eof = function()
{
    return this.pos >= this.data.length;
}

reader.prototype.tail = function()
{
    var res = this.data.substr(this.pos, this.data.length - this.pos);
    this.pos = this.data.length;
    return res;
}

reader.prototype.isErrorPacket = function()
{
    return this.data.charCodeAt(0) == 0xff;
}

reader.prototype.readOKpacket = function()
{
   var res = {};
   res.field_count = this.data.charCodeAt(this.pos++);
   if (res.field_count == 0xff) // error
   {
       res.errno = this.data.charCodeAt(this.pos) + (this.data.charCodeAt(this.pos+1)<<8);
       this.pos += 2;
       //this.pos++; // skip sqlstate marker, "#"
       //res.sqlstate = this.bytes(5);
   } else {
       res.affected_rows = this.lcnum();
       res.insert_id = this.lcnum();
       res.server_status = this.num(2);
       res.warning_count = this.num(2);
   }
   res.message = this.tail();
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

exports.reader = reader;
exports.writer = writer;
