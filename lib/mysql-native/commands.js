// expose api methods
exports.auth = require('./commands/auth');
exports.end = exports.close = require('./commands/close');
exports.query = require('./commands/query');
exports.prepare = require('./commands/prepare');
exports.execute = require('./commands/execute');
exports.debug = require('./commands/debug');
exports.ping = require('./commands/ping');
