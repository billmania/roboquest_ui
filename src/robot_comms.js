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

  /**
   * The class to manage communication with the robot and the ROS graph.
   *
   * @param {string} nodeName - The name for the ROS node on the graph.
   * @param {Function} sendToClient_cb - The callback for sending payloads to the client.
   */
  constructor (nodeName, sendToClientCb) {
    this.nodeName = nodeName
    this.send_to_client_cb = sendToClientCb

    this.rclnodejs = rclnodejs

    this.read_config_file()
    this.setupRos()

    this.counter = 0
    this.telemetryMessages = 0
    this.imageMessages = 0
    this.configuration = null
  }

  /**
   * Setup the basic connection to the ROS graph.
   */
  setupRos () {
    this.rclnodejs.init()
    this.node = this.rclnodejs.createNode(this.nodeName)
    this.logger = this.rclnodejs.logging.getLogger(this.nodeName)
    this.logger.setLoggerLevel(this.logger.LoggingSeverity.DEBUG)

    this.telemetry_sub = this.node.createSubscription(
      'rq_msgs/msg/Telemetry',
      'telemetry',
      this.telemetry_cb.bind(this))
    this.image_sub = this.node.createSubscription(
      'sensor_msgs/msg/CompressedImage',
      'image_raw/compressed',
      this.image_cb.bind(this))
    this.logger.debug('ROS setup completed')
  }

  telemetry_cb (msg) {
    this.telemetryMessages++
  }

  /**
   * base64 encode a JPEG image.
   *
   * @param {ArrayBuffer} jpegImage - The complete JPEG image, in binary.
   */
  image_to_base64 (jpegImage) {
    let jpegImageAscii = ''
    const jpegImageBuffer = new Uint8Array(jpegImage)

    // TODO: Find a less brute-force method
    for (let i = 0; i < jpegImageBuffer.byteLength; i++) {
      jpegImageAscii += String.fromCharCode(jpegImageBuffer[i])
    }

    return btoa(jpegImageAscii)
  }

  /**
   * Called when a ROS incoming image message arrives. Extract the data
   * portion and send it to the browser client via a socket emit as the
   * 'mainImage' event. The payload sent with the 'mainImage' emit must
   * be a complete JPEG encoding of the image, further encoded into a
   * base64 representation.
   *
   * The configuration of the image messages is controlled by the
   * usb_cam/set_parameters service. The most useful parameters
   * are:
   * ['camera_name', 'framerate', 'image_width', 'image_height',
   *  'image_raw.format', 'pixel_format', 'video_device']
   *
   * @param {CompressedImage} msg - The complete ROS image message
   */
  image_cb (msg) {
    this.imageMessages++
    const jpegImage = msg.data
    this.send_to_client_cb('mainImage', this.image_to_base64(jpegImage))
  }

  /**
   * Use the contents of the RQ_PARAMS.CONFIG_FILE as a definition
   * of the ROS subscriptions.
   *
   * @param configuration {JSON} - The configuration data parsed from the file.
   */
  configure_data_flow (configuration) {
    const widgets = configuration.widgets
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
    this.logger.info(`${this.nodeName} started`)

    this.rclnodejs.spin(this.node)
  }
}

module.exports = RobotComms
