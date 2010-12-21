var sys = require('sys');
var writer = require('../serializers').writer;
var field_flags = require('../constants').field_flags;
var flags = require('../constants').flags;
var types = require('../constants').types;
var pack = require('../pack');
var cmd = require('../command')

function parseTime(s)
{
    // no parsing here with non-binary prtocol, return date as is
    return s;
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

/*
var type_seriliaers = {};
type_serialisers['string'] = serialiseString;

function serialiseString(a)
{
    var w = new writer();
    w.lcstring(s);
    return w.data;
}
*/

var string2type = function(str, t)
{
    return type_parsers[t](str);
}

module.exports = function(sql, row_as_hash)
{
    var c = new cmd(
    {
        start: function()
        {
            this.write( new writer().add("\u0003").add(this.sql) );
            return 'rs_ok';
        },
        rs_ok: function( r )
        {
            var ok = r.readOKpacket();
            this.insert_id = ok.insert_id;
            this.affected_rows = ok.affected_rows;
            if (ok.field_count == 0)
            { 
                return 'done';
            }
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
            {
                return 'done';
            }

            var use_hash = this.connection.get('row_as_hash') || row_as_hash;

            var row = row_as_hash ? {} : [];
            var field_index = 0;
            while (!r.eof())
            {
                var field = this.fields[field_index];
                var strValue = r.lcstring();
                var value = string2type(strValue, field.type); // todo: move to serialiser unpackString
                this.store_column(row, field, value, use_hash)
                field_index++;
            }
            this.emit('row', row, this.fields, use_hash);
        }
    });
    c.sql = sql;
    return c;
}