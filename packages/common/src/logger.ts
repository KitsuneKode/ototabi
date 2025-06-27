import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json({
      space: 2,
    }),
  ),
  defaultMeta: { service: 'ototabi' },
  transports: [
    //

    //
    new transports.File({
      filename: '../../../logs/error.log',
      level: 'error',
    }),
    new transports.File({
      filename: '../../../logs/info.log',
      level: 'info',
    }),
  ],
})

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.prettyPrint({
          colorize: true,
          depth: 10,
        }),
      ),
    }),
  )
}

export default logger
