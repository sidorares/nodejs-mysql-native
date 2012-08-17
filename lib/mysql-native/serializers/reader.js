var constants = require('../constants');
var util = require('util');

function reader(data)
{
   this.data = data;
   this.pos = 0;

}

reader.prototype.dump = function()
{
    for (var i=this.pos; i < this.data.length; ++i)
    {
        util.puts(this.data.charCodeAt(i));
    }
}

// libmysql sets all fields to zero when binary packet has zero length
function zeroTime()
{
   // todo: check how zero date is serialized to output in mysql
   return new Date();
}

reader.prototype.unpackBinaryTime = function()
{
    var length = this.lcnum();
    if (length == 0)
       return zeroTime();
    var sign = this.num(1);
    var day = this.num(4);
    var hour = this.num(1);
    var minutes = this.num(1);
    var seconds = this.num(1);
    var millisec = (length > 8) ? this.num(4) : 0;
    if (day != 0)
        hour += day*24;
    var millisec_time_val = millisec + seconds*1000 + minutes*60000 + hour*3600000;
    if (sign != 0)
        millisec_time_val *= -1;
    return millisec_time_val;
}

reader.prototype.unpackBinaryDateTime = function()
{
    var length = this.lcnum();
    if (length == 0)
       return zeroTime();

    var y = this.num(2);
    var m = this.num(1);
    var d = this.num(1);

    var hour = 0;
    var min = 0;
    var sec = 0;
    if (length > 4)
    {
       hour = this.num(1);
       min = this.num(1);
       sec = this.num(1);
    }
    var millisec = (length > 8) ? this.num(4) : 0;
    var dt = new Date();
    dt.setYear(y);
    dt.setMonth(m - 1);
    dt.setDate(d);
    dt.setHours(hour);
    dt.setMinutes(min);
    dt.setSeconds(sec);
    dt.setMilliseconds(millisec);
    return dt;
}

reader.prototype.unpackBinaryDate = function()
{
    var length = this.lcnum();
    if (length == 0)
       return zeroTime();

    var y = this.num(2);
    var m = this.num(1);
    var d = this.num(1);
    var dt = new Date();
    dt.setYear(y);
    dt.setMonth(m - 1);
    dt.setDate(d);

    return dt;
}

function parseIEEE754Float(data, pos)
{
    // debug
    /*
    var bytes = [];
    for (var i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
    }
    console.log('bytes', JSON.stringify(bytes), 'pos', pos);
    */
    // end debug
   
    var fraction = 0.0;
    fraction += data.charCodeAt(pos + 0) / ( 128 * 256 * 256);
    fraction += data.charCodeAt(pos + 1) / ( 128 * 256 );
    fraction += (data.charCodeAt(pos + 2) & 0x7f) / 128.0;
    //console.log('fraction', fraction);

    var signbit = data.charCodeAt(pos + 3) & 0x80;
    //console.log('signbit', signbit);
    var a = ((data.charCodeAt(pos + 2) & 0x80) >> 7);
    var b = ((data.charCodeAt(pos + 3) & 0x7F) << 1);
    //console.log('a', a, 'b', b);
    var exponent = a + b; 
    //console.log('exponent', exponent);

    var factor = Math.pow(2,exponent-127);
    var mantissa = 1.0 + fraction;
    var sign = signbit > 0 ? -1 : 1;
    return sign*factor*mantissa;
}

function parseIEEE754Double(data, pos)
{
    // debug
    /*
    var bytes = [];
    for (var i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
    }
    console.log('bytes', JSON.stringify(bytes), 'pos', pos);
    */
    // end debug
   
    var fraction = 0.0;
    fraction += data.charCodeAt(pos + 0) / ( 16 * 256 * 256 * 256 * 256 * 256 * 256);
    fraction += data.charCodeAt(pos + 1) / ( 16 * 256 * 256 * 256 * 256 * 256 );
    fraction += data.charCodeAt(pos + 2) / ( 16 * 256 * 256 * 256 * 256 );
    fraction += data.charCodeAt(pos + 3) / ( 16 * 256 * 256 * 256);

    fraction += data.charCodeAt(pos + 4) / ( 16 * 256 * 256 );
    fraction += data.charCodeAt(pos + 5) / ( 16 * 256 );
    fraction += (data.charCodeAt(pos + 6) & 0x0f) / 16.0;

    var signbit = data.charCodeAt(pos + 7) & 128;
    var exponent = ((data.charCodeAt(pos + 6) & 0xf0) >> 4) + ((data.charCodeAt(pos + 7) & 127) << 4);

    var factor = Math.pow(2,exponent-1023);
    var mantissa = 1.0 + fraction;
    var sign = signbit > 0 ? -1 : 1;
    return sign*factor*mantissa;
}

// deserialise mysql binary field
reader.prototype.unpackBinary = function(type, unsigned)
{
    // http://dev.mysql.com/doc/refman/5.0/en/numeric-types.html

    // debug dump
    //return "_not_implemented_ " + constants.type_names[type] + " " + util.inspect(this.data);

    var result;
    switch (type)
    {
    case constants.types.MYSQL_TYPE_STRING:
    case constants.types.MYSQL_TYPE_VAR_STRING:
    case constants.types.MYSQL_TYPE_BLOB:
        result = this.lcstring();
        break;
    // TODO: here are only unsigned version of int deserialisers!
    case constants.types.MYSQL_TYPE_TINY:
        result = this.num(1);
        break;
    case constants.types.MYSQL_TYPE_SHORT:
        result = this.num(2);
        break;
    case constants.types.MYSQL_TYPE_LONG:
        result = this.num(4);
        break;
    case constants.types.MYSQL_TYPE_LONGLONG:
        result = this.num(8);
        break;
    case constants.types.MYSQL_TYPE_NEWDECIMAL:
        result = parseFloat(this.lcstring());
        break;
    case constants.types.MYSQL_TYPE_FLOAT:
        result = parseIEEE754Float(this.data, this.pos);
        this.pos += 4;
        break;
    case constants.types.MYSQL_TYPE_DOUBLE:
        result = parseIEEE754Double(this.data, this.pos);
        this.pos += 8;
        break;
    case constants.types.MYSQL_TYPE_BIT:
        result = this.lcbits();
        break;
/*
  MYSQL_TYPE_TIMESTAMP: 7,
  MYSQL_TYPE_LONGLONG: 8,
  MYSQL_TYPE_INT24: 9,
  MYSQL_TYPE_DATE: 10,
  MYSQL_TYPE_TIME: 11,
  MYSQL_TYPE_DATETIME: 12,
  MYSQL_TYPE_YEAR: 13,
  MYSQL_TYPE_NEWDATE: 14,

*/
    case constants.types.MYSQL_TYPE_DATE:
         return this.unpackBinaryDate();
    case constants.types.MYSQL_TYPE_TIME:
         return this.unpackBinaryTime();
    case constants.types.MYSQL_TYPE_DATETIME:
    case constants.types.MYSQL_TYPE_TIMESTAMP:
         return this.unpackBinaryDateTime();
    default:
        result = "_not_implemented_ " + constants.type_names[type] + " " + util.inspect(this.data); //todo: throw exception here
    }
    return result;
}

// read n-bytes number
// TODO: add unsigned flag and code to read signed/unsigned integers
reader.prototype.num = function(numbytes)
{
    var res = 0;
    var factor = 1;
    for (var i=0; i < numbytes; ++i)
    {
        res += this.data.charCodeAt(this.pos) * factor;
        factor = factor * 256;
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
   return field;
}

function binary(n)
{
    var res = "";
    var nbits = 0;
    while(n != 0)
    {
        var bit = n - Math.floor(n/2)*2;
        res = bit + res;
        n = Math.floor(n/2);
        nbits++;
    }
    for(; nbits <= 8; ++nbits)
         res = "0" + res;
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
    return res;
}

reader.prototype.lcbits = function()
{
    var len = this.lcnum();
    var val = this.num(len);
    var bitstring = [];
    while(val>0){
        bitstring.push((val % 2)?true:false);
        val = Math.floor(val/2);
    }
    if(bitstring.length==1){
        return bitstring[0];
    }
    return bitstring;
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
       // at least for 1040 +8 offset is incorrect TODO: check where +8 comes from
       if (res.errno != 1040)
           this.pos += 8;
       else
           this.pos += 2;
       //this.pos++; // skip sqlstate marker, "#"
       //res.sqlstate = this.bytes(5); FIXME!!!

   } else if (res.field_count == 0xfe && this.data.length < 9) {
      // eof packet
      res.warning_count = this.num(2);
      res.server_status = this.num(2);
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
   if (b1 < 251)
       return b1;
   else if (b1 == 252)
       return this.num(2);
   else if (b1 == 253)
       return this.num(3);
   else if (b1 == 254)
       return this.num(8);
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

module.exports = reader;
