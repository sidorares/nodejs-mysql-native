var writer = require('../serializers/writer');
var field_flags = require('../constants').field_flags;
var flags = require('../constants').flags;
var types = require('../constants').types;
var pack = require('../pack');
var cmd = require('../command')
var result = require('../result')

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

function parseNumber(s, type) {
  if (s == "") {
    return parseNull()
  }
  else
  {
    switch(type)
    {
      case types.MYSQL_TYPE_DECIMAL:
      case types.MYSQL_TYPE_TINY:
      case types.MYSQL_TYPE_SHORT:
      case types.MYSQL_TYPE_LONG:
      case types.MYSQL_TYPE_LONGLONG:
      case types.MYSQL_TYPE_INT24:
      case types.MYSQL_TYPE_BIT:
        return parseInt(s)
        break;
      case types.MYSQL_TYPE_FLOAT:
      case types.MYSQL_TYPE_DOUBLE:
      case types.MYSQL_TYPE_NEWDECIMAL:
        return parseFloat(s)
        break;
    }
  }
}

var type_parsers = {};
  type_parsers[types.MYSQL_TYPE_DECIMAL] =  parseNumber;
  type_parsers[types.MYSQL_TYPE_TINY] = parseNumber;
  type_parsers[types.MYSQL_TYPE_SHORT] = parseNumber;
  type_parsers[types.MYSQL_TYPE_LONG] = parseNumber;
  type_parsers[types.MYSQL_TYPE_FLOAT] = parseNumber;
  type_parsers[types.MYSQL_TYPE_DOUBLE] = parseNumber;
  type_parsers[types.MYSQL_TYPE_NULL] = parseNull;
  type_parsers[types.MYSQL_TYPE_TIMESTAMP] = parseTime;
  type_parsers[types.MYSQL_TYPE_LONGLONG] = parseNumber;
  type_parsers[types.MYSQL_TYPE_INT24] = parseNumber;
  type_parsers[types.MYSQL_TYPE_DATE] = parseTime;
  type_parsers[types.MYSQL_TYPE_TIME] = parseTime;
  type_parsers[types.MYSQL_TYPE_DATETIME] = parseTime;
  type_parsers[types.MYSQL_TYPE_YEAR] = parseTime;
  type_parsers[types.MYSQL_TYPE_NEWDATE] = parseTime;
  type_parsers[types.MYSQL_TYPE_VARCHAR] = parseString;
  type_parsers[types.MYSQL_TYPE_BIT] = parseNumber;
  type_parsers[types.MYSQL_TYPE_NEWDECIMAL] = parseNumber;
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
    return type_parsers[t](str, t);
}

module.exports = function(sql)
{
  var c = new cmd(
  {
    start: function()
    {
      this.stmt = sql;
      var charset = this.client.charset;
      this.write( new writer().add("\u0003").add( charset ? charset.convertToBytes( this.stmt ) : this.stmt ));
      return 'rs_ok';
    },
    rs_ok: function( r )
    {
      this.result = new result()

      var ok = r.readOKpacket();
      this.result.insert_id = ok.insert_id
      this.result.affected_rows = ok.affected_rows
      // todo better event name?
      this.emit('resultset_start', this.result);
      if (ok.field_count == 0)
      {
        this.emit('result', this.result)
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
            var eof = r.readOKpacket();
            if (eof.server_status & 8) // SERVER_MORE_RESULTS_EXISTS
            {
                return 'rs_ok';
            }
            return 'done';
        }

        var use_hash = this.client.get('row_as_hash');
        var row = use_hash ? {} : [];
        var field_index = 0;
        var charset = this.client.charset;
        while (!r.eof())
        {
            var field = this.fields[field_index];
            var strValue = r.lcstring();
            if( charset )
                strValue = charset.convertFromBytes( strValue );

            var value = string2type(strValue, field.type); // todo: move to serialiser unpackString
            this.store_column(row, field, value, use_hash)
            field_index++;
        }
        // todo: remember whole resultset inly if callback is passed as last argument to query()
        this.result.rows.push(row)
        this.emit('row', row, this.fields, use_hash);
    }
  });

  return c;
}
