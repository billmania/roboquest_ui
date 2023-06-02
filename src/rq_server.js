'use strict'

/**
 * rq_server.js is the script started by NodeJS.
 */

const RQ_PARAMS = require('./params.js')
const RobotComms = require('./robot_comms.js')
const robotComms = new RobotComms('rq_server')

const WebServer = require('./web_server.js')
const webServer = new WebServer('RobotConsoleV2')

setInterval(
  webServer.send_heartbeat.bind(webServer),
  RQ_PARAMS.SERVER_HEARTBEAT_PERIOD_S * 1000)

robotComms.main()
