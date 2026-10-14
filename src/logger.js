import winston from 'winston'
const {combine, timestamp, errors, json} = winston.format
export const logger = winston.createLogger({
    level: 'debug',
    format: combine(timestamp(), json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: '/tmp/rq_server.log',
        })
    ]
})
