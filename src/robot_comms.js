'use strict'

/**
 * The interface between the robot information and the UI.
 */

const RQ_PARAMS = require('./params.js')
// Use the rclnodejs module for interacting with the ROS graph
const rclnodejs = require('rclnodejs')
// Use the fs module for reading configuration and settings files.
const fs = require('fs')

/**
 * RobotComms reads the RQ_PARAMS.CONFIG_FILE and uses its
 * contents to connect to the ROS graph.
 */
class RobotComms {
  #counter
  #telemetryMessages
  #configuration

  constructor (nodeName) {
    this.nodeName = nodeName
    this.rclnodejs = rclnodejs

    this.read_config_file()
    this.setupRos()

    this.counter = 0
    this.telemetryMessages = 0
    this.configuration = null
  }

  /**
   * Setup the basic connection to the ROS graph. Add a demonstration
   * subscription and publisher.
   */
  setupRos () {
    this.rclnodejs.init()
    this.node = this.rclnodejs.createNode(this.nodeName)
    this.logger = this.rclnodejs.logging.getLogger(this.nodeName)
    this.logger.setLoggerLevel(this.logger.LoggingSeverity.DEBUG)

    // TODO: Remove this publisher and subscriber
    this.publisher = this.node.createPublisher(
      'std_msgs/msg/String',
      this.nodeName + '_topic')
    this.logger.debug('Setup to publish String')
    this.subscription = this.node.createSubscription(
      'rq_msgs/msg/Telemetry',
      'telemetry',
      this.telemetryCb.bind(this))
    this.logger.debug('Setup to subscribe Telemetry')
  }

  telemetryCb (msg) {
    this.telemetryMessages++
  }

  stringPublisher () {
    this.publisher.publish(`Here I am ${this.counter}`)
    this.counter += 1
  }

  /**
   * Use the contents of the RQ_PARAMS.CONFIG_FILE as a definition
   * of the ROS subscriptions.
   *
   * @param configuration {JSON} - The configuration data parsed from the file.
   */
  configure_data_flow (configuration) {
    const widgets = configuration.widgets
    this.logger.debug(`configuration ${JSON.stringify(widgets, null, 2)}`)
  }

  /**
   * Read the contents of the RQ_PARAMS.CONFIG_FILE. If successful,
   * pass the contents to configure_data_flow().
   */
  read_config_file () {
    /**
     * Process the Promise from reading the CONFIG_FILE.
     *
     * @param error {?} - The completion status from reading the file
     * @param contents {string} - The contents of the file
     */
    function handlePromise (error, contents) {
      if (error) {
        this.logger.fatal(`Reading ${RQ_PARAMS.CONFIG_FILE}: ${error}`)
        throw new Error(`Failed to read ${RQ_PARAMS.CONFIG_FILE}`)
      }

      try {
        this.configuration = JSON.parse(contents)
      } catch (exception) {
        this.logger.fatal(`Parsing ${RQ_PARAMS.CONFIG_FILE}: ${exception}`)
        throw new Error(`Failed to parse ${RQ_PARAMS.CONFIG_FILE}`)
      }

      this.configure_data_flow(this.configuration)
    }

    fs.readFile(RQ_PARAMS.CONFIG_FILE, handlePromise.bind(this))
  }

  main () {
    // TODO: Look for a more ROS2 interval mechanism
    setInterval(this.stringPublisher.bind(this), 1000)
    this.logger.info(`${this.nodeName} started`)

    this.rclnodejs.spin(this.node)
  }
}

module.exports = RobotComms
