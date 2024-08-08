'use strict'

/**
 * The interface between the robot information and the UI.
 */

const rclnodejs = require('rclnodejs')
const set = require('lodash.set')
const cloneDeep = require('lodash.clonedeep')

const DEFAULT_CAMERA = '0'

// TODO: Convert these to classes to get a new object every time
const Control = {
  set_charger: '',
  set_fet1: '',
  set_fet2: '',
  set_motors: '',
  set_servos: ''
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

    this.image_sub = null

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
    this._servicesTopicsClient = this.create_service_client(
      'rq_msgs/srv/ServicesTopics',
      'services_topics'
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
    if (Object.hasOwn(this.publishedTopics, name)) {
      const rosMessage = this.buildPublishMessage(name, payload)
      try {
        this.publishers[name].publish(rosMessage)
      } catch (error) {
        this.logger.warn(
          `handle_payload: ERROR topic:${name}` +
          `, Type:${error.name}` +
          `, Message:${error.message}`
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
    } else if (name === 'services_topics') {
      this._servicesTopicsClient.sendRequest(
        {},
        (response) => {
          this.send_to_client_cb('services_topics', JSON.stringify(response))
        }
      )
    } else if (name === 'choose_camera') {
      this.choose_camera(payload)
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
   * Subscribe to an image topic.
   *
   * @param {string} cameraId - the numerical ID of the camera
   */
  choose_camera (cameraId) {
    if (this.image_sub) {
      this.node.destroySubscription(this.image_sub)
      this.image_sub = null
    }

    this.logger.debug(`choose_camera: ${cameraId}`)
    const cameraTopic = 'rq_camera_node' + cameraId + '/image_raw/compressed'
    this.image_sub = this.node.createSubscription(
      'sensor_msgs/msg/CompressedImage',
      cameraTopic,
      { history: 1, depth: 1 },
      this.image_cb.bind(this))
  }

  /**
   * Parse a widget configuration data object, extracting the topic
   * or service.
   *
   * @param {object} widgetData - the widget's data configuration
   */
  _parseWidgetConfigData (widgetData) {
    if (widgetData.topic) {
      switch (widgetData.topicDirection) {
        case 'subscribe': {
          if (!this.subscribers[widgetData.topic]) {
            this.subscribers[widgetData.topic] = this.create_subscriber(
              widgetData.topic,
              widgetData.topicType)
            this.logger.debug('Added subscriber for ' + widgetData.topic)
          }
          return
        }

        case 'publish': {
          if (!this.publishers[widgetData.topic]) {
            this.publishers[widgetData.topic] = this.create_publisher(
              widgetData.topic,
              widgetData.topicType)
            this.publishedTopics[widgetData.topic] = widgetData.topicType
            this.logger.debug('Added publisher for ' + widgetData.topic)
          }
          return
        }

        default: {
          this.logger.warn(
            ' topic ' + widgetData.topic + ' had no direction')
          return
        }
      }
    }

    if (widgetData.service) {
      if (this.serviceClients[widgetData.service]) {
        /*
         * Services can be called by multiple UI components. The response
         * to a service call is ignored.
         * */
        return
      }

      const serviceClient = this.create_service_client(
        widgetData.serviceType,
        widgetData.service)
      if (serviceClient) {
        this.serviceClients[widgetData.service] = serviceClient
        this.services.push(widgetData.service)
        this.logger.debug('Added serviceClient for ' + widgetData.service)
      } else {
        this.logger.warn(`Service ${widgetData.service} not available`)
      }
    }
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
    this.choose_camera(DEFAULT_CAMERA)

    for (const widgetConfig of widgetsConfig) {
      this.logger.debug(
        'Parsing widget ' +
        widgetConfig.type + ' ' + widgetConfig.label
      )
      if (Array.isArray(widgetConfig.data)) {
        for (const widgetDataRow of widgetConfig.data) {
          this._parseWidgetConfigData(widgetDataRow)
        }
      } else {
        this._parseWidgetConfigData(widgetConfig.data)
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
