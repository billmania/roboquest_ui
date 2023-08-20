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
    this.getConfiguration(
      buildPage,
      this.mapSubscriptionData.bind(this),
      (eventName, payload) => {
        this.socket.send_event(eventName, payload)
      }
    )

    this.setupSocketEvents()
    console.log('RQTesting instantiated')
  }

  /**
   * TODO: What is this method supposed to do?
   */
  mouseEnterWidget (elementEntered) {
    console.log(`Mouse entered widget ${elementEntered.id}`)
    elementEntered.style.zIndex = 100
  }

  /**
   * TODO: What is this method supposed to do?
   */
  mouseLeaveWidget (elementLeft) {
    console.log(`Mouse left widget ${elementLeft.id}`)
    elementLeft.style.zIndex = 6
  }

  /**
   * Retrieve the configuration file from the server. When it's received,
   * cause it to be processed by buildPage().
   *
   * @param {Function} buildPage - The function which builds the page using the configuration.
   * @param {Function} mapSubscriptionData - The function to associate subscribed data to a
   *                                         destination
   * @param {Function} dataReturnCb - used by the widget to return an event_name and
   *                                  a payload
   */
  getConfiguration (buildPage, mapSubscriptionData, dataReturnCb) {
    const configRequest = new XMLHttpRequest()
    configRequest.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        const configuration = JSON.parse(configRequest.responseText)
        const widgetsList = buildPage(
          configuration,
          dataReturnCb)
        mapSubscriptionData(configuration.widgets, widgetsList)
        this.pageBuilt = true
      }
    }
    configRequest.open('GET', RQ_PARAMS.TEST_CONFIG_FILE, true)
    configRequest.send()
  }

  /**
   * Update the application software on the robot. This action
   * is expected to terminate the NodeJS server.
   */
  updateSoftware () {
    console.log('updateSoftware() called')

    this.socket.send_event('control_hat', '{"set_charger": "ON"}')

    const mainImage = document.getElementById('mainImage')
    mainImage.style.display = 'none'

    const allWidgets = document.getElementsByClassName('panel dragable')
    for (const widget of allWidgets) {
      widget.style.display = 'none'
    }

    const updateText = document.getElementById('updateText')
    updateText.style.display = 'inline'

    this.socket.send_event('update', '{}')
  }

  /**
   * Use this.configuration and this.widgetsList to create a map
   * from the pair eventName:attribute to the pair widgetId:widgetElement.
   * The created subscription map is saved as this.subscriptionDataMap because
   * I still don't grok all of the JavaScript borkage of "this".
   *
   * Each eventName:attribute can be assigned to only one widget. The last widget
   * claiming the attribute is the winner.
   *
   * @param {Object} widgetsConfig - the definition of the widgets
   * @param {Object} widgetsList - the collection of created widgets
   *
   * The map is an object like:
   *  "telemetry": {
   *    "battery_v": {
   *      "widget": widget,
   *      "prefix": "Battery V ",
   *      "suffix": ""
   *    },
   *    "header.stamp.sec": {
   *      "widget": otherWidget,
   *      "prefix": "",
   *      "suffix": " secs"
   *    }
   *  }
   *
   */
  mapSubscriptionData (widgetsConfig, widgetsList) {
    const subscriptionMap = {}
    for (const widgetConfig of widgetsConfig) {
      console.log(`widget ${widgetConfig.name} ${widgetConfig.id}`)

      if (widgetConfig.topicDirection !== 'subscribe') {
        continue
      }

      if (!subscriptionMap[widgetConfig.topic]) {
        subscriptionMap[widgetConfig.topic] = {}
        console.log(`adding new subscribed topic ${widgetConfig.topic}`)
      } else {
        console.log(`${widgetConfig.topic} already subscribed.`)
      }

      switch (widgetConfig.type) {
        case '_value': {
          subscriptionMap[widgetConfig.topic][widgetConfig.topicAttribute] = {
            type: widgetConfig.type,
            prefix: widgetConfig.prefix,
            suffix: widgetConfig.suffix,
            widget: widgetsList[widgetConfig.id]
          }
          console.log(`added topicAttribute ${widgetConfig.topicAttribute}`)
          break
        }

        case '_indicator': {
          subscriptionMap[widgetConfig.topic][widgetConfig.topicAttribute] = {
            type: widgetConfig.type,
            trueText: widgetConfig.trueText,
            falseText: widgetConfig.falseText,
            widget: widgetsList[widgetConfig.id]
          }
          console.log(`added topicAttribute ${widgetConfig.topicAttribute}`)
          break
        }

        default: {
          console.log(`No support for widget type ${widgetConfig.type}`)
        }
      }
    }

    this.subscriptionDataMap = subscriptionMap
  }

  /**
   * Define how to process incoming socket events by specifying
   * the event name and the callback for it.
   *
   */
  setupSocketEvents () {
    this.socket.add_event('mainImage', this.image_cb.bind(this))

    // TODO: Enhance this to instead use this.subscriptionDataMap
    this.socket.add_event('telemetry', this.telemetry_cb.bind(this))

    console.log('setupSocketEvents')
  }

  /**
   * Receive the mainImage event from the server and update
   * the UI with the video frame.
   *
   * @param {ArrayBuffer} jpegImage - the frame to be displayed
   *
   * jpegImage is expected to be a complete JPEG representation
   * of the image. Before it can be pasted into the cameraFrames
   * element src attribute, it must be base64-encoded.
   *
   * See https://developer.mozilla.org/en-US/docs/web/http/basics_of_http/data_urls
   * and https://developer.mozilla.org/en-US/docs/Glossary/Base64
   */
  image_cb (jpegImage) {
    let jpegImageStr = ''
    const jpegImageBuffer = new Uint8Array(jpegImage)
    for (let i = 0; i < jpegImageBuffer.byteLength; i++) {
      jpegImageStr += String.fromCharCode(jpegImageBuffer[i])
    }

    this.cameraFrames.src = `data:image/jpeg;base64,${btoa(jpegImageStr)}`
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
   * For a widget to receive telemetry data, it's type must be
   * one of '_value' or '_indicator'. It must also have an element
   * with the HTML ID 'text_ap'.
   *
   * @param {JSON string} telemetry - the stringified object containing
   *                                  telemetry
   */
  // TODO: Disable calling this callback while it's already running
  telemetry_cb (telemetryStr) {
    const telemetry = JSON.parse(telemetryStr)
    for (const attribute in this.subscriptionDataMap.telemetry) {
      const textAp = this.subscriptionDataMap.telemetry[attribute].widget.querySelector('#text_ap')
      switch (this.subscriptionDataMap.telemetry[attribute].type) {
        case '_value': {
          textAp.innerText =
            this.subscriptionDataMap.telemetry[attribute].prefix +
            this.getMessageAttribute(telemetry, attribute) +
            this.subscriptionDataMap.telemetry[attribute].suffix
          break
        }

        case '_indicator': {
          textAp.innerText =
            (this.getMessageAttribute(telemetry, attribute)
              ? this.subscriptionDataMap.telemetry[attribute].trueText
              : this.subscriptionDataMap.telemetry[attribute].falseText)
          break
        }

        default: {
          console.log(
            'telemetry_cb() Does not support widget type ' +
            this.subscriptionDataMap.telemetry[attribute].widget.type
          )
          break
        }
      }
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
  disconnect_cb (reason) {
    this.robotConnected = false
    console.log('Robot disconnected because ' + reason)
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
