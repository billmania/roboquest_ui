'use strict'

const RobotComms = require('./robot_comms.js')
const robotComms = new RobotComms('rq_server')

const ExpressComms = require('./express_comms.js')
// eslint-disable-next-line no-unused-vars
const expressComms = new ExpressComms('RobotConsoleV2')

setInterval(expressComms.send_heartbeat.bind(expressComms), 1000)

console.log('Starting main()')
robotComms.main()
