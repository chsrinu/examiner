/**
 * Logger file for generating the logs @root/logs folder.
 * Based on the enviroment the least log level will be decided
 */

const winston = require('winston');

module.exports = (label) => {
  const getEnvTransports = (env) => {
    const filePath = new Date().toLocaleDateString().replace('/', '-').replace('/', '-');
    switch (env) {
      case 'development':
      default:
        return [
          new winston.transports.Console({
            level: 'info',
          }),
        ];
      case 'production':
      case 'test':
        return [
          new winston.transports.File({
            level: 'info',
            filename: `${rootDir}/logs/${filePath}.log`,
          }),
        ];
    }
  };
  const logConfig = {
    transports: getEnvTransports(process.env.NODE_ENV),
    format: winston.format.combine(
      winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
      winston.format.label({ label }),
      winston.format.printf((info) => `${info.level} : ${info.label} : ${info.timestamp} : ${info.message}  ${info.stack ? '\n'.concat(info.stack) : ''}`),
    ),
  };

  return winston.createLogger(logConfig);
};
