'use strict'

/**
 * rq_server.js is the script started by NodeJS. It instantiates both
 * WebServer and RobotComms and then acts as the broker between them.
 */

const RQ_PARAMS = require('./params.js')
const ConfigFile = require('./config_file.js')
const configFile = new ConfigFile()

const WebServer = require('./web_server.js')
const webServer = new WebServer(
  'RobotConsoleV2',
  configFile)

const RobotComms = require('./robot_comms.js')
const robotComms = new RobotComms(
  'rq_server',
  webServer.send_to_client.bind(webServer),
  configFile)

/*
 * Define which eventNames to expect coming from the UI, so they
 * can be routed to the event handler.
 */
for (const topicToPublish of robotComms.published_topics_list()) {
  webServer.add_incoming_event(topicToPublish)
}
for (const serviceToCall of robotComms.services_list()) {
  webServer.add_incoming_event(serviceToCall)
}

/*
 * Setup the means to use messages from the UI to interact with
 * the ROS graph.
 * The eventName argument is a string. The payload is an object.
 */
webServer.setup_send_to_robot((eventName, payload) => {
  robotComms.handle_payload(eventName, payload)
})

/*
 * Now that all of the configuration and setup details have been
 * given to the web server, actually start it.
 */
webServer.setup_client_comms()

setInterval(
  webServer.send_event_counters.bind(webServer),
  RQ_PARAMS.COUNTERS_PERIOD_S * 1000)

robotComms.main()
