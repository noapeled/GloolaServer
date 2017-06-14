var winston = require('winston');

winston.configure({
    transports: [
        new (winston.transports.File)({ filename: 'gloola.log' })
    ]
});

module.exports = function (msg) {
    console.log('[' + (new Date()).toISOString() + ']', msg);
    winston.info(msg);
};
