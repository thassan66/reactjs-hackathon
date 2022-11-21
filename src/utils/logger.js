const { createLogger, format, transports, config, addColors } = require('winston');
const { combine, timestamp, label, printf, colorize } = format;

// Can't use config module as it usings the logger
const level = process.env.LOG_LEVEL || 'info';

const levels = {
  ...config.npm.levels,
  web: 2,
  service: 2,
  websocket: 2,
};

const levelColors = {
  ...config.npm.colors,
  web: 'cyan',
  service: 'yellow',
  websocket: 'blue',
};

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

function createCustomLogger(project) {
  return createLogger({
    transports: [
      new transports.Console({
        level,
        timestamp: true,
        handleExceptions: false,
        json: false,
        colorize: true,
      }),
    ],
    levels,
    format: combine(
      colorize(),
      label({ label: project }),
      timestamp(),
      myFormat
    ),
    exitOnError: false,
  });
}
addColors(levelColors);

module.exports = { createCustomLogger } ;
