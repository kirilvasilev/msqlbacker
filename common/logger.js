const winston = require('winston');
const { app } = require('electron');
const path = require('path');

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
            new winston.transports.File({ filename: path.join(app.getAppPath(), 'logs','error.log'), level: 'error' }),
            new winston.transports.File({ filename: path.join(app.getAppPath(), 'logs', 'msqlbacker.log'), level: 'info' }),
        ],
    });

    return logger;
}

module.exports = getLogger;
