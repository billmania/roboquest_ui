'use strict'

/**
 * The interface between the robot information and the UI.
 */

const RQ_PARAMS = require('./params.js')
const rclnodejs = require('rclnodejs')
const { readFileSync } = require('node:fs')
const TwistStamped = {
  header: {
    stamp: {
      sec: 0,
      nanosec: 0
    },
    frame_id: ''
  },
  twist: {
    linear: {
      x: 0,
      y: 0,
      z: 0
    },
    angular: {
      x: 0,
      y: 0,
      z: 0
    }
  }
}

/**
 * RobotComms reads the RQ_PARAMS.CONFIG_FILE and uses its
 * contents to connect to the ROS graph.
 */
class RobotComms {
  #counter
  #telemetryMessages
  #imageMessages
  #configuration

  /**
   * The class to manage communication with the robot and the ROS graph.
   *
   * @param {string} nodeName - The name for the ROS node on the graph.
   * @param {Function} sendToClient_cb - The callback for sending payloads to the client.
   */
  constructor (nodeName, sendToClientCb) {
    this.nodeName = nodeName

    this.subscribers = {}
    this.publishers = {}
    this.publishedTopics = []
    this.serviceClients = {}

    this.rclnodejs = rclnodejs
    this.rclnodejs.init()
    this.node = this.rclnodejs.createNode(this.nodeName)
    this.logger = this.rclnodejs.logging.getLogger(this.nodeName)
    this.logger.setLoggerLevel(this.logger.LoggingSeverity.DEBUG)

    this.send_to_client_cb = sendToClientCb

    this.read_config_file()
    this.setup_ROS(this.configuration.widgets)

    this.counter = 0
    this.telemetryMessages = 0
    this.imageMessages = 0
    this.configuration = null
  }

  /**
   * Return an Array of published topics.
   *
   * @returns {Array} - the topics as strings
   */
  published_topics_list () {
    return this.publishedTopics
  }

  /**
   * Publish a message onto a topic with the included data. Based on
   * the topic name, the message object must be retrieved. The data
   * from the message must then be inserted into the message object.
   *
   * @param {string} topicName -
   * @param {string} message - as a JSON string with the data for the
   *                           widgetConfig.msgAttribute(s)
   */
  publish_message (topicName, message) {
    const rosMessage = this.buildRosMessage(topicName, message)
    this.publishers[topicName].publish(rosMessage)
  }

  /**
   * Using the topicName, retrieve the empty ROS message object.
   * Using the contents of message, populate the required attributes
   * of the ROS message object.
   * Return the populated ROS message.
   *
   * @param {string} topicName
   * @param {Array} message
   *
   * @returns {ROS message object
   */
  buildRosMessage (topicName, message) {
    if (topicName !== 'cmd_vel') {
      this.logger.warn('Only cmd_vel implemented so far')
      return null
    }

    const rosMessage = TwistStamped
    rosMessage.twist.linear.x = message[0]
    rosMessage.twist.angular.z = message[1]

    return rosMessage
  }

  /**
   * Create a subscriber and a callback based on a widget definition.
   *
   * @param {string} topicName -
   * @param {string} msgType -
   *
   * @returns {Object} - the subscriber
   */
  create_subscriber (topicName, msgType) {
    const subscriberName = topicName + '_sub'
    const subscriberCallback = topicName + '_cb'

    this.logger.debug(`create_subscriber: ${topicName}, ${msgType}`)

    this[subscriberCallback] = (msg) => {
      this.send_to_client_cb(topicName, JSON.stringify(msg))
    }

    this[subscriberName] = this.node.createSubscription(
      msgType,
      topicName,
      this[subscriberCallback].bind(this))

    return this[subscriberName]
  }

  /**
   * Create a publisher based on a widget definition.
   *
   * @param {string} topicName -
   * @param {string} msgType -
   *
   * @returns {Object} - the publisher
   */
  create_publisher (topicName, msgType) {
    const publisherName = topicName + '_pub'

    this.logger.debug(`create_publisher: ${topicName}, ${msgType}`)

    this[publisherName] = this.node.createPublisher(
      topicName,
      msgType
    )

    return this[publisherName]
  }

  /**
   * Setup the connections to the ROS graph. This includes the
   * creation of topic subscribers and publishers as well as service
   * clients.
   *
   * @param {Object} widgetsConfig - the object which describes all of the
   *                                 widgets, including those which require a
   *                                 publisher, subscriber, or service client.
   */
  setup_ROS (widgetsConfig) {
    this.logger.info(`${this.nodeName} started`)

    /*
     * The image_sub subscriber isn't associated with any widget.
     */
    this.image_sub = this.node.createSubscription(
      'sensor_msgs/msg/CompressedImage',
      'image_raw/compressed',
      this.image_cb.bind(this))

    for (const widgetConfig of widgetsConfig) {
      if (widgetConfig.topic) {
        switch (widgetConfig.topicDirection) {
          case 'subscribe': {
            if (!this.subscribers[widgetConfig.topic]) {
              this.subscribers[widgetConfig.topic] = this.create_subscriber(
                widgetConfig.topic,
                widgetConfig.msgType)
              this.logger.debug('Added subscriber for ' + widgetConfig.topic)
            }
            break
          }

          case 'publish': {
            if (!this.publishers[widgetConfig.topic]) {
              this.publishers[widgetConfig.topic] = this.create_publisher(
                widgetConfig.msgType,
                widgetConfig.topic)
              this.publishedTopics.push(widgetConfig.topic)
              console.log(`publishedTopics: ${this.publishedTopics}`)
              this.logger.debug('Added publisher for ' + widgetConfig.topic)
            }
            break
          }

          default: {
            this.logger.warn(
              'widget ' + widgetConfig.id + ' had' +
              ' topic ' + widgetConfig.topic + ' but no direction')
            break
          }
        }

        continue
      }

      if (widgetConfig.service) {
        this.logger.debug('Found service ' + widgetConfig.service)
      }
    }
  }

  /**
   * From the incoming ROS Telemetry message, assemble a JSON
   * string and send it to the browser client as the 'telemetry'
   * event.
   */
  telemetry_cb (msg) {
    this.telemetryMessages++
    this.send_to_client_cb('telemetry', JSON.stringify(msg))
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
   * Read the contents of the RQ_PARAMS.CONFIG_FILE. If successful,
   * save the parsed configuration as this.configuration.
   */
  read_config_file () {
    try {
      const configurationRaw = readFileSync(RQ_PARAMS.CONFIG_FILE)
      this.configuration = JSON.parse(configurationRaw)
    } catch (error) {
      this.logger.fatal(`Reading ${RQ_PARAMS.CONFIG_FILE}: ${error}`)
      throw new Error(`Failed to read ${RQ_PARAMS.CONFIG_FILE}`)
    }
  }

  main () {
    this.rclnodejs.spin(this.node)
  }
}

module.exports = RobotComms
