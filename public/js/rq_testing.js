/**
 * RQTesting is used to test communications with the backend and
 * functionality of the hardware. It's supposed to be much more stable
 * and much less complex than RQMain.
 */
'use strict'

class RQTesting {
  /**
   * Setup the class.
   */
  constructor () {
    this.socket = new RQSocket(
      this.connect_cb.bind(this),
      this.disconnect_cb.bind(this))
    this.robotConnected = false
    this.subscriptionDataMap = null
    this.cameraFrames = document.getElementById('mainImage')
    this.pageBuilt = false
    this.getConfiguration(buildPage, this.mapSubscriptionData.bind(this))

    this.setupSocketEvents()
    console.log('RQTesting instantiated')
  }

  /**
   * Retrieve the configuration file from the server. When it's received,
   * cause it to be processed by buildPage().
   *
   * @param {Function} buildPage - The function which builds the page using the configuration.
   * @param {Function} mapSubscriptionData - The function to associate subscribed date to a
   *                                         destination
   */
  getConfiguration (buildPage, mapSubscriptionData) {
    const configRequest = new XMLHttpRequest()
    configRequest.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        const configuration = JSON.parse(configRequest.responseText)
        const widgetsList = buildPage(configuration)
        mapSubscriptionData(configuration.widgets, widgetsList)
        this.pageBuilt = true
      }
    }
    configRequest.open('GET', RQ_PARAMS.TEST_CONFIG_FILE, true)
    configRequest.send()
  }

  /**
   * Update the application software on the robot. This action
   * is expected to terminate the server.
   */
  updateSoftware () {
    console.log('updateSoftware() called')

    this.socket.send_event('control', 'charger=ON')

    const mainImage = document.getElementById('mainImage')
    mainImage.style.display = 'none'
    const updateText = document.getElementById('updateText')
    console.log('Display: ' + updateText.style.display)
    updateText.style.display = 'inline'

    this.socket.send_event('update', '')
  }

  /**
   * Use this.configuration and this.widgetsList to create a map
   * from the pair eventName:attribute to the pair widgetId:widgetElement.
   * The created subscription map is saved as this.subscriptionDataMap because
   * I still don't grok all of the JavaScript borkage of "this".
   *
   * @param {Object} widgetsConfig - the definition of the widgets
   * @param {Object} widgetsList - the collection of created widgets
   *
   * The map is an object like:
   *  "telemetry": {
   *    "battery_v": {
   *      "destination": widget,
   *      "prefix": "Battery V ",
   *      "suffix": ""
   *    },
   *    "header.stamp.sec": {
   *      "destination": otherWidget,
   *      "prefix": "",
   *      "suffix": " secs"
   *    }
   *  }
   *
   */
  mapSubscriptionData (widgetsConfig, widgetsList) {
    const subscriptionMap = {}
    for (const widgetConfig of widgetsConfig) {
      if (!widgetConfig.topicDirection || !widgetConfig.topicDirection === 'subscribe') {
        continue
      }

      if (!subscriptionMap[widgetConfig.topic]) {
        subscriptionMap[widgetConfig.topic] = {}
        console.log(`adding topic ${widgetConfig.topic}`)
      }
      subscriptionMap[widgetConfig.topic][widgetConfig.msgAttribute] = {
        prefix: widgetConfig.prefix,
        suffix: widgetConfig.suffix,
        widget: widgetsList[widgetConfig.id]
      }
      console.log(`added msgAttribute ${widgetConfig.msgAttribute}`)
    }

    console.log('subscriptionMap: ' + JSON.stringify(subscriptionMap))
    this.subscriptionDataMap = subscriptionMap
  }

  /**
   * Define how to process incoming socket events by specifying
   * the event name and the callback for it.
   *
   */
  setupSocketEvents () {
    this.socket.add_event('hb', this.heartbeat_cb.bind(this))
    this.socket.add_event('mainImage', this.image_cb.bind(this))

    // TODO: Enhance this to accept a list of {topic, callback}
    this.socket.add_event('telemetry', this.telemetry_cb.bind(this))

    console.log('setupSocketEvents')
  }

  /**
   * Receive the heartbeat event from the server and update
   * the UI.
   *
   * @param {int} payload - the millisecond timestamp of the heartbeat.
   */
  heartbeat_cb (payload) {
    console.log(`hb event received: ${payload}`)
  }

  /**
   * Receive the mainImage event from the server and update
   * the UI with the video frame.
   *
   * @param {ArrayBuffer} jpegImage - the frame to be displayed
   *
   * jpegImage is expected to be a complete JPEG representation
   * of the image.
   */
  image_cb (jpegImage) {
    this.cameraFrames.src = `data:image/jpeg;base64,${jpegImage}`
  }

  /**
   * When msg is an object and attribute is a string describing the chain
   * of object properties, return the value of the attribute in msg.
   *
   * @param {Object} msg - the incoming ROS message as an Object
   * @param {string} attribute - the attribute value to return
   *
   * @returns {} value
   *
   * For example with the msg "{ header: { stamp: { sec: 5, nsec: 6 } }, battery_v: 12.3 }"
   * and the attribute "header.stamp.sec", getMessageAttribute() will return 5.
   */
  getMessageAttribute (msg, attribute) {
    let value = msg
    for (const a of attribute.split('.')) {
      value = value[a]
    }

    return value
  }

  /**
   * Receive the telemetry JSON string. Extract the individual
   * attributes and update the relevant entities on the page.
   *
   * @param {JSON string} telemetry - the stringified object containing
   *                                  telemetry
   */
  // TODO: Disable calling this callback while it's already running
  telemetry_cb (telemetryStr) {
    const telemetry = JSON.parse(telemetryStr)
    for (const attribute in this.subscriptionDataMap.telemetry) {
      console.log(`telemetry_cb: ${attribute} ${this.getMessageAttribute(telemetry, attribute)}`)
      const text_ap = this.subscriptionDataMap.telemetry[attribute].widget.querySelector('#text_ap')
      text_ap.innerText =
        this.subscriptionDataMap.telemetry[attribute].prefix +
        this.getMessageAttribute(telemetry, attribute).toFixed(2) +
        this.subscriptionDataMap.telemetry[attribute].suffix
    }
  }

  /**
   * Responds when the socket connection is established.
   */
  connect_cb () {
    this.robotConnected = true
    console.log('Robot connected')
  }

  /**
   * Responds when the socket connection is lost.
   */
  disconnect_cb () {
    this.robotConnected = false
    console.log('Robot disconnected')
  }

  /**
   * Send a heartbeat to the robot.
   *
   */
  send_heartbeat () {
    if (this.robotConnected) {
      this.socket.send_event('hb', Date.now().toString())
    } else {
      console.log('Heartbeat not sent because robot not connected')
    }
  }

  /**
   * Control visibility of the message widget and set its text.
   *
   * @param {string} text - The message to display.
   * @param {boolean} showProgressBar - Whether to include the progress bar.
   * @parqam {integer} messageDurationSec - The duration the message will be displayed.
   *
   */
  show_message (text, showProgressBar, messageDurationSec) {
    console.log(`Message: ${text}, duration sec: ${messageDurationSec}`)

    this.messageMask.style.display = 'inline'
    document.getElementById('messagePanel').style.display = 'flex'
    document.getElementById('messagePanelText').innerHTML = text

    if (showProgressBar) {
      document.getElementById('restartToCockpit').style.display = 'unset'
      document.getElementById('progress_bar').style.display = 'flex'
      document.getElementById('progress_bar_measure').style.width = '1%'
      setTimeout(() => {
        document.getElementById('progress_bar_measure').style.width = '100%'
      }, 5)
    }

    if (messageDurationSec) {
      setTimeout(this.hide_message(), messageDurationSec * 1000)
    }
  }

  /**
   * Remove visibility of the message widget.
   *
   */
  hide_message () {
    this.messageMask.style.display = 'none'

    document.getElementById('restartToCockpit').style.display = 'none'
    document.getElementById('messagePanel').style.display = 'none'
    document.getElementById('progress_bar_measure').style.width = '1%'
  }
} // RQTesting

const rqTesting = new RQTesting()

setInterval(rqTesting.send_heartbeat.bind(rqTesting), 10000)
