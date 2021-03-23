const { createLogger, format, transports } = require('winston');

const loggerLevel = 'info'

const logger = createLogger({
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        format.colorize({all : true}),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`+
            (info.splat!==undefined?`${info.splat}`:" "))
    ),
    transports: [
        new (transports.Console)({ level: loggerLevel }),
    ]
});
module.exports = logger;