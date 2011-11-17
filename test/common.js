module.exports.createClient = function()
{
    var connParams = { 
        database: 'test', 
            user: 'tester', 
        password: 'testpass', 
          socket: '/var/run/mysqld/mysqld.sock' 
    };

    if (process.platform.match(/win/)) {
	connParams.socket = null;
	connParams.port = 3306;
    }
  
    return require('../lib/mysql-native').createClient(connParams);
}