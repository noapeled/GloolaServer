var winston = require('winston');

winston.configure({
    transports: [
        new (winston.transports.File)({ filename: 'gloola.log' })
    ]
});

function info(msg) {
    console.log('[' + (new Date()).toISOString() + ']', '[INFO]', msg);
    winston.info(msg);
}

function error(msg) {
    console.log('[' + (new Date()).toISOString() + ']', '[ERROR]', msg);
    winston.error(msg);
}

exports.info = info;
exports.error = error;
