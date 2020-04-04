'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

const appFormat = printf(({
    level,
    message,
    timestamp
}) => `[totem] ${timestamp} [${level}] ${message}`);

const logger = createLogger({
    level: 'info',
    format: combine(
        colorize(),
        timestamp(),
        appFormat
    ),
    transports: [
        new transports.Console()
    ]
});

module.exports = logger;