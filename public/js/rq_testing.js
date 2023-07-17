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
    this.cameraFrames = document.getElementById('mainImage')

    this.setupSocketEvents()
    console.log('RQTesting instantiated')
  }

  /**
   * Retrieve the configuration file from the server. When it's received,
   * save it for future use.
   */
  getConfiguration () {
    const configRequest = new XMLHttpRequest()
    configRequest.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        this.configurationData = JSON.parse(configRequest.responseText)
      }
    }
    configRequest.open('GET', RQ_PARAMS.CONFIG_FILE, true)
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
   * Define how to process incoming socket events by specifying
   * the event name and the callback for it.
   */
  setupSocketEvents () {
    this.socket.add_event('hb', this.heartbeat_cb.bind(this))
    this.socket.add_event('mainImage', this.image_cb.bind(this))
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
