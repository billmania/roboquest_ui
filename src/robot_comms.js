'use strict'

/**
 * The interface between the robot information and the UI.
 */

const RQ_PARAMS = require('./params.js')
const rclnodejs = require('rclnodejs')
const { readFileSync } = require('node:fs')
/*
 * It's possible to get these ROS message objects via rclnodejs.createMessageObject(),
 * but it is not obivous how to initialize them to 0 and ''.
 */
// TODO: Convert these to classes to get a new object every time
const Control = {
  set_charger: '',
  set_fet1: '',
  set_fet2: '',
  set_motors: '',
  set_servos: ''
}
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
const ServoAngles = {
  header: {
    stamp: {
      sec: 0,
      nanosec: 0
    },
    frame_id: ''
  },
  servos: []
}
const ServoAngle = {
  name: '',
  angle: 0
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
    this.services = []

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
   * Return an Array of services.
   *
   * @returns {Array} - the service names as strings
   */
  services_list () {
    return this.services
  }

  /**
   * Handle a message incoming from the UI. It's either a message
   * to be published onto a topic or a service to be called, determined
   * by the name.
   *
   * @param {string} name - the name of the topic or the service
   * @param {string|object} message - string data for the
   *                                  widgetConfig.topicAttribute(s)
   *                                  or object for serviceAttribute(s)
   */
  handle_message (name, message) {
    if (this.publishedTopics.includes(name)) {
      const rosMessage = this.buildRosMessage(name, message)
      // TODO: ROS topic messages must be published regularly
      // TODO: Replace this with an interval
      this.publishers[name].publish(rosMessage)
    } else if (this.services.includes(name)) {
      const serviceRequest = this.buildServiceMessage(name, message)
      this.serviceClients[name].sendRequest(
        serviceRequest,
        (response) => {
          if (!response.success) {
            this.logger.warn(
              `Service ${name} failed`)
          }
        }
      )
    } else {
      this.logger.warn(`handle_message(): ${name} not recognized as publish or service`)
    }
  }

  /**
   * Using the serviceName, retrieve the empty ROS request object.
   * Using the contents of message, populate the required attributes
   * of the ROS request object.
   * Return the populated ROS request message.
   *
   * @param {string} serviceName
   * @param {object} message
   *
   * @returns {ROS request message}
   */
  buildServiceMessage (serviceName, message) {
    if (serviceName !== 'control_hat') {
      this.logger.warn('Only control_hat implemented so far')
      return null
    }

    const requestMessage = Control
    const requestAttributes = message
    /*
     * requestAttributes is an object with one or more of the properties defined
     * for the Control message.
     */
    for (const attribute in requestAttributes) {
      requestMessage[attribute] = requestAttributes[attribute]
    }

    return requestMessage
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
    let rosMessage

    switch (topicName) {
      case ('cmd_vel'): {
        rosMessage = TwistStamped
        /*
         * message is [x, y]. y represents the joystick fore-and-aft position.
         * x represents the side-to-side. The y value is used to set the linear
         * velocity and the x value to set the angular velocity.
         */
        rosMessage.twist.linear.x = message[1]
        rosMessage.twist.angular.z = message[0]
        break
      }

      case ('servos'): {
        rosMessage = ServoAngles
        rosMessage.servos = []
        const servoAngle = ServoAngle

        servoAngle.name = message[0]
        servoAngle.angle = message[1]
        rosMessage.servos.push(servoAngle)
        break
      }

      default: {
        this.logger.warn(`messages for topic ${topicName} not yet implemented`)
        return null
      }
    }

    return rosMessage
  }

  /**
   * Create a service client based on a widget definition.
   *
   * @param {string} serviceType - the request/response message for the service
   * @param {string} serviceName - the name of the service
   *
   */
  create_service_client (serviceType, serviceName) {
    const serviceClient = this.node.createClient(
      serviceType,
      serviceName
    )

    serviceClient.waitForService(1000)
      .then((result) => {
        if (!result) {
          this.logger.warn(`Service ${serviceName} not available`)
          return null
        }
      })
    return serviceClient
  }

  /**
   * Create a subscriber and a callback based on a widget definition.
   *
   * @param {string} topicName -
   * @param {string} topicType -
   *
   * @returns {Object} - the subscriber
   */
  create_subscriber (topicName, topicType) {
    const subscriberName = topicName + '_sub'
    const subscriberCallback = topicName + '_cb'

    this[subscriberCallback] = (msg) => {
      this.send_to_client_cb(topicName, JSON.stringify(msg))
    }

    this[subscriberName] = this.node.createSubscription(
      topicType,
      topicName,
      this[subscriberCallback].bind(this))

    return this[subscriberName]
  }

  /**
   * Create a publisher based on a widget definition.
   *
   * @param {string} topicName -
   * @param {string} topicType -
   *
   * @returns {Object} - the publisher
   */
  create_publisher (topicName, topicType) {
    const publisherName = topicName + '_pub'

    this[publisherName] = this.node.createPublisher(
      topicType,
      topicName
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
    // TODO: Replace this with a call to create_subscriber()
    this.image_sub = this.node.createSubscription(
      'sensor_msgs/msg/CompressedImage',
      'rq_camera_node/image_raw/compressed',
      this.image_cb.bind(this))

    for (const widgetConfig of widgetsConfig) {
      this.logger.debug('Parsing widget ' + widgetConfig.type + ' ' + widgetConfig.name)
      if (widgetConfig.topic) {
        switch (widgetConfig.topicDirection) {
          case 'subscribe': {
            if (!this.subscribers[widgetConfig.topic]) {
              this.subscribers[widgetConfig.topic] = this.create_subscriber(
                widgetConfig.topic,
                widgetConfig.topicType)
              this.logger.debug('Added subscriber for ' + widgetConfig.topic)
            }
            continue
          }

          case 'publish': {
            if (!this.publishers[widgetConfig.topic]) {
              this.publishers[widgetConfig.topic] = this.create_publisher(
                widgetConfig.topic,
                widgetConfig.topicType)
              this.publishedTopics.push(widgetConfig.topic)
              this.logger.debug('Added publisher for ' + widgetConfig.topic)
            }
            continue
          }

          default: {
            this.logger.warn(
              'widget ' + widgetConfig.id + ' had' +
              ' topic ' + widgetConfig.topic + ' but no direction')
            continue
          }
        }
      }

      if (widgetConfig.service) {
        if (this.serviceClients[widgetConfig.service]) {
          /*
           * Services can be called by multiple UI components. The response
           * to a service call is ignored.
           * */
          continue
        }

        const serviceClient = this.create_service_client(
          widgetConfig.serviceType,
          widgetConfig.service)
        if (serviceClient) {
          this.serviceClients[widgetConfig.service] = serviceClient
          this.services.push(widgetConfig.service)
          this.logger.debug('Added serviceClient for ' + widgetConfig.service)
        } else {
          this.logger.warn(`Service ${widgetConfig.service} not available`)
        }
        continue
      }
    }
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
