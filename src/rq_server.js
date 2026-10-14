'use strict'

/**
 * rq_server.js is the script started by NodeJS. It instantiates both
 * WebServer and RobotComms and then acts as the broker between them.
 */

import { logger } from './logger.js'
logger.info('rq_server starting')

import RQ_PARAMS from './params.js'
import ConfigFile from './config_file.js'
const configFile = new ConfigFile()

import { WebServer } from './web_server.js'
logger.debug('Instantiating WebServer')
const webServer = new WebServer(
  'RobotConsoleV2',
  configFile)

import { RobotComms } from './robot_comms.js'
logger.debug('Instantiating RobotComms')
const robotComms = new RobotComms(
  'rq_server',
  webServer.send_to_client.bind(webServer),
  configFile)


/*
 * Define which eventNames to expect coming from the UI, so they
 * can be routed to the event handler.
 */
logger.debug('Setup incoming ROS events')
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
logger.debug('Setup outgoing ROS events')
webServer.setup_send_to_robot((eventName, payload) => {
  robotComms.handle_payload(eventName, payload)
})

/*
 * Now that all of the configuration and setup details have been
 * given to the web server, actually start it.
 */
logger.debug('Setup client comms')
webServer.setup_client_comms()

logger.debug('Start the web server event counter')
setInterval(
  webServer.send_event_counters.bind(webServer),
  RQ_PARAMS.COUNTERS_PERIOD_S * 1000)

logger.debug('Start robot comms')
robotComms.main()
