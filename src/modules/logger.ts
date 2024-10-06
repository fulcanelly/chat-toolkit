import { createLogger, format, transports } from "winston";
import { consoleFormat } from "winston-console-format";
import DailyRotateFile from 'winston-daily-rotate-file';


export const logger = createLogger({
  level: 'silly',
  format: format.combine(
    format.timestamp(),
    format.ms(),
    format.errors({ stack: true }),
    format.splat(),
    // format.timestamp({format:'MM-YY-DD'}),
    format.json()
  ),

  defaultMeta: { service: "Moscalbot" },
  transports: [
    // new transports.Console(),
    new DailyRotateFile({filename: 'logs/log.txt'}),
    new transports.Console({
      format: format.combine(
        // format.timestamp({format:'MM-YY-DD'}),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        }),

        format.colorize({ all: true }),
        format.padLevels(),

        consoleFormat({
          showMeta: true,
          metaStrip: [ "service"],
          inspectOptions: {
            depth: Infinity,
            colors: true,
            maxArrayLength: Infinity,
            breakLength: 120,
            compact: Infinity,
          },
        })

      ),
    }),
  ],
});
