const winston = require('winston');

function getLogger(className) {
    // eslint-disable-next-line object-curly-newline
    const myFormat = winston.format.printf(({ level, message, label, timestamp }) => `${timestamp} [${label}] ${level}: ${message}`);
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.label({ label: className }),
            myFormat,
        ),
        defaultMeta: { className },
        transports: [
            new winston.transports.File({ filename: './log/error.log', level: 'error' }),
            new winston.transports.File({ filename: './log/msqlbacker.log' }),
        ],
    });

    return logger;
}

module.exports = getLogger;
