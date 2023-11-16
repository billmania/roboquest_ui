'use strict'

/**
 * The interface between the robot information and the UI.
 */

const rclnodejs = require('rclnodejs')
const set = require('lodash.set')
const cloneDeep = require('lodash.clonedeep')

/*
 * Attempted all of the following:
 * rclnodejs.createMessage(): missing hasMember()
 * rclnodejs.createMessageObject(): but only the non-terminal objects
 * rclnodejs.require(): very similar to createMessage()
 */
// TODO: Convert these to classes to get a new object every time
const Control = {
  set_charger: '',
  set_fet1: '',
  set_fet2: '',
  set_motors: '',
  set_servos: ''
}
const servoAngles = {
  header: {
    stamp: {
      sec: 0,
      nanosec: 0
    },
    frame_id: ''
  },
  servos: []
}
const servoAngle = {
  name: '',
  angle: 0
}

/**
 * Get current wall time as a ROS header.stamp object.
 *
 * @returns {object}
 */
function getRosTimestamp () {
  const timestamp = Date.now()

  return {
    sec: Math.trunc(timestamp / 1000),
    nanosec: Math.trunc(timestamp / 1000 % 1 * 1000000000)
  }
}

/**
 * RobotComms reads the configuration file and uses its
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
  constructor (nodeName, sendToClientCb, configFile) {
    this.nodeName = nodeName

    this.subscribers = {}
    this.publishers = {}
    this.publishedTopics = {}
    this.serviceClients = {}
    this.services = []

    this.rclnodejs = rclnodejs
    this.rclnodejs.init()
    this.node = this.rclnodejs.createNode(this.nodeName)
    this.logger = this.rclnodejs.logging.getLogger(this.nodeName)
    this.logger.setLoggerLevel(this.logger.LoggingSeverity.DEBUG)

    this.send_to_client_cb = sendToClientCb
    this.configFile = configFile

    this.read_config_file()
    this.setup_ROS(this.configuration.widgets)

    this._restartServiceClient = this.create_service_client(
      'std_srvs/srv/Empty',
      'restart'
    )
    if (this._restartServiceClient !== undefined) {
      this.logger.debug('_restartServiceClient set')
    }

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
    const publishedTopics = []
    for (const topic in this.publishedTopics) {
      if (Object.hasOwn(this.publishedTopics, topic)) {
        publishedTopics.push(topic)
      }
    }

    return publishedTopics
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
   * Handle a payload incoming from the UI. It's either for a message
   * to be published onto a topic or for a service to be called, determined
   * by the name. The name is either a topic name or a service name. The name
   * always corresponds one-to-one with an event name.
   *
   * @param {string} name - the name of the topic or the service
   * @param {object} payload - data for the widgetConfig.data.topicAttribute(s)
   *                           or widgetConfig.data.serviceAttribute(s)
   */
  handle_payload (name, payload) {
    console.debug(
      `handle_payload: name: ${name}` +
      `, payload: ${JSON.stringify(payload)}`)
    if (Object.hasOwn(this.publishedTopics, name)) {
      const rosMessage = this.buildPublishMessage(name, payload)
      try {
        this.publishers[name].publish(rosMessage)
      } catch (error) {
        this.logger.warn(
          `handle_payload: Type:${error.name}, Message:${error.message}` +
          `, name:${name}, rosMessage:${JSON.stringify(rosMessage)}`
        )
      }
    } else if (this.services.includes(name)) {
      const serviceRequest = this.buildServiceMessage(name, payload)
      this.serviceClients[name].sendRequest(
        serviceRequest,
        (response) => {
          if (!response.success) {
            this.logger.warn(
              `Service ${name} failed`)
          }
        }
      )
    } else if (name === 'restart') {
      /*
       * This is a special "system" service, not associated with a widget. In
       * the future, there may be more of these services. If that comes,
       * this logic will be replaced with a separate function capable of
       * handling multiple system services.
       */
      this.logger.debug('handle_payload: Calling restart service')
      this._restartServiceClient.sendRequest(
        {},
        (response) => {
          /*
           * The restart service has an Empty response, so there's
           * nothing to check, beyond the fact it returned.
           */
          this.logger.info('handle_payload: restart called')
        }
      )
    } else {
      this.logger.warn(`handle_payload(): ${name} not recognized as publish or service`)
    }
  }

  /**
   * Using the serviceName, retrieve the empty ROS request object.
   * Using the contents of message, populate the required attributes
   * of the ROS request object.
   * It is the responsibility of the UI to:
   *
   * 1. know the ROS service message request properties
   * 2. map the widget's value(s) to the appropriate property
   *
   * Return the populated ROS request message.
   *
   * @param {string} serviceName
   * @param {object} message - contains key-value pairs, where the key is a
   *                           property of the message and the value is the
   *                           value for that property
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
   *
   * It is the responsibility of the UI to:
   *
   * 1. know the ROS topic message attributes
   * 2. map the widget's value(s) to the appropriate attribute
   *
   * Return the populated ROS message.
   *
   * This method uses the lodash Object.set() utility function
   * to assign a value for an attribute of a ROS message.
   *
   * @param {string} topicName
   * @param {object} message - contains key-value pairs, where the key is a
   *                           property of the message and the value is the
   *                           value for that property
   *
   * @returns {ROS message object}
   */
  buildPublishMessage (topicName, message) {
    switch (topicName) {
      case ('servos'): {
        servoAngles.header.stamp = getRosTimestamp()
        servoAngles.servos = []

        for (const attribute in message) {
          set(servoAngle, attribute, message[attribute])
        }
        servoAngles.servos.push(servoAngle)

        return servoAngles
      }

      default: {
        const publishMessageClass = rclnodejs.createMessage(
          this.publishedTopics[topicName]
        )._refObject
        /*
         * TODO:
         * This is admittedly ugly. It's based completely on not understanding
         * two things:
         * 1. how to get a new ROS message object from rclnodejs
         * 2. why this implementation works
         */
        const publishMessage = JSON.parse(
          JSON.stringify(
            cloneDeep(publishMessageClass)
          )
        )

        set(publishMessage, 'header.stamp', getRosTimestamp())
        set(publishMessage, 'header.frame_id', '')
        for (const attribute in message) {
          set(publishMessage, attribute, message[attribute])
        }

        return publishMessage
      }
    }
  }

  /**
   * Create a service client based on a widget definition.
   *
   * @param {string} serviceType - the request/response message for the service
   * @param {string} serviceName - the name of the service
   *
   * @returns {object} - the service client object
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
      { history: 1, depth: 1 },
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
      { history: 1, depth: 1 },
      this.image_cb.bind(this))

    for (const widgetConfig of widgetsConfig) {
      this.logger.debug('Parsing widget ' + widgetConfig.type + ' ' + widgetConfig.label)
      if (widgetConfig.data.topic) {
        switch (widgetConfig.data.topicDirection) {
          case 'subscribe': {
            if (!this.subscribers[widgetConfig.data.topic]) {
              this.subscribers[widgetConfig.data.topic] = this.create_subscriber(
                widgetConfig.data.topic,
                widgetConfig.data.topicType)
              this.logger.debug('Added subscriber for ' + widgetConfig.data.topic)
            }
            continue
          }

          case 'publish': {
            if (!this.publishers[widgetConfig.data.topic]) {
              this.publishers[widgetConfig.data.topic] = this.create_publisher(
                widgetConfig.data.topic,
                widgetConfig.data.topicType)
              this.publishedTopics[widgetConfig.data.topic] = widgetConfig.data.topicType
              this.logger.debug('Added publisher for ' + widgetConfig.data.topic)
            }
            continue
          }

          default: {
            this.logger.warn(
              'widget ' + widgetConfig.id + ' had' +
              ' topic ' + widgetConfig.data.topic + ' but no direction')
            continue
          }
        }
      }

      if (widgetConfig.data.service) {
        if (this.serviceClients[widgetConfig.data.service]) {
          /*
           * Services can be called by multiple UI components. The response
           * to a service call is ignored.
           * */
          continue
        }

        const serviceClient = this.create_service_client(
          widgetConfig.data.serviceType,
          widgetConfig.data.service)
        if (serviceClient) {
          this.serviceClients[widgetConfig.data.service] = serviceClient
          this.services.push(widgetConfig.data.service)
          this.logger.debug('Added serviceClient for ' + widgetConfig.data.service)
        } else {
          this.logger.warn(`Service ${widgetConfig.data.service} not available`)
        }
        continue
      }
    }
  }

  /**
   * base64 encode a JPEG image.
   *
   * @param {ArrayBuffer} jpegImage - The complete JPEG image, in binary.
   *
   * Camera frames from the RaspiCam are about 2 MB, so this is a very
   * expensive method.
   */
  image_to_base64 (jpegImage) {
    let jpegImageStr = ''
    const jpegImageBuffer = new Uint8Array(jpegImage)

    // TODO: Find a less brute-force method
    for (let i = 0; i < jpegImageBuffer.byteLength; i++) {
      jpegImageStr += String.fromCharCode(jpegImageBuffer[i])
    }

    return btoa(jpegImageStr)
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
    this.send_to_client_cb('mainImage', jpegImage)
  }

  /**
   * Read the contents of the configuration file. If successful,
   * save the parsed configuration as this.configuration.
   */
  read_config_file () {
    try {
      this.configuration = this.configFile.get_config()
    } catch (error) {
      this.configuration = null
      this.logger.fatal(`Reading configuration file: ${error}`)
      throw new Error('Failed to read configuration file')
    }
  }

  main () {
    this.rclnodejs.spin(this.node)
  }
}

module.exports = RobotComms
