var sys = require('sys');
var writer = require('./serializers').writer;
var field_flags = require('./constants').field_flags;
var flags = require('./constants').flags;
var types = require('./constants').types;
var pack = require('./pack');
//var cmd = require('./command')

var mysql_type = function(js_type)
{
}

// expose api methods
exports.auth = require('./cmd/auth')
exports.close = require('./cmd/close')
exports.query = require('./cmd/query')
exports.prepare = require('./cmd/prepare')
exports.execute = require('./cmd/execute')
exports.debug = require('./cmd/debug')

