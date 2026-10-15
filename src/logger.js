import winston from 'winston'
import RQ_PARAMS from './params.js'

const {combine, timestamp, errors, json} = winston.format
const logger = winston.createLogger({
    level: 'debug',
    format: combine(timestamp(), json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: RQ_PARAMS.LOG_FILE,
        })
    ]
})

export default logger
