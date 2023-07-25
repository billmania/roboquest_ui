'use strict'

/**
 * rq_server.js is the script started by NodeJS. It instantiates both
 * WebServer and RobotComms and then acts as the broker between them.
 */

const RQ_PARAMS = require('./params.js')

const WebServer = require('./web_server.js')
const webServer = new WebServer('RobotConsoleV2')
// TODO: get the events from the configuration file
webServer.add_incoming_event('cmd_vel')
webServer.setup_client_comms()

const RobotComms = require('./robot_comms.js')
const robotComms = new RobotComms(
  'rq_server',
  webServer.send_to_client.bind(webServer))

setInterval(
  webServer.send_heartbeat.bind(webServer),
  RQ_PARAMS.SERVER_HEARTBEAT_PERIOD_S * 1000)

robotComms.main()
