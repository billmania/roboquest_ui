'use strict'

const rclnodejs = require('rclnodejs')
const logger = rclnodejs.logging.getLogger('rq_server')
logger.setLoggerLevel(logger.LoggingSeverity.DEBUG)
let counter = 1

rclnodejs.init()
const node = rclnodejs.createNode('rq_server')
const publisher = node.createPublisher('std_msgs/msg/String', 'rclnode_topic')

function telemetryCb (msg) {
  logger.debug('Received telemetry ', msg)
}

function stringPublisher () {
  publisher.publish(`Here I am ${counter}`)
  counter = counter + 1
}

function main () {
  setInterval(stringPublisher, 1000)

  node.createSubscription('rq_msgs/msg/Telemetry',
    'telemetry',
    telemetryCb)
  logger.debug('Subscribed to telemetry')

  logger.info('rq_ui node started')
  rclnodejs.spin(node)
}

main()
