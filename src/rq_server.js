'use strict'

/**
 * rq_server.js is the script started by NodeJS. It instantiates both
 * WebServer and RobotComms and then acts as the broker between them.
 */

const RQ_PARAMS = require('./params.js')

const WebServer = require('./web_server.js')
const webServer = new WebServer('RobotConsoleV2')

const RobotComms = require('./robot_comms.js')
const robotComms = new RobotComms(
  'rq_server',
  webServer.send_to_client.bind(webServer))

for (const topicToPublish of robotComms.published_topics_list()) {
  console.log(`topicToPublish ${topicToPublish}`)
  webServer.add_incoming_event(topicToPublish)
}
webServer.setup_send_to_robot((eventName, payload) => {
  robotComms.publish_message(eventName, payload)
})
webServer.setup_client_comms()

setInterval(
  webServer.send_heartbeat.bind(webServer),
  RQ_PARAMS.SERVER_HEARTBEAT_PERIOD_S * 1000)

robotComms.main()
