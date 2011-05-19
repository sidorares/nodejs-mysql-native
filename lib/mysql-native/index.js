var client = require('./client');

exports.createClient = client.createClient;
exports.createTCPClient = client.createTCPClient;
exports.createUNIXClient = client.createUNIXClient;