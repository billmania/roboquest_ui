/**
 * RQMain manages the appearance of the UI on the browser page, updating
 * it with messages from the backend server and sending commands to
 * the backend.
 */
'use strict'


class RQMain {
  /**
   * Setup the class.
   */
  constructor () {
    this.socket = new RQSocket(
      this.connect_cb.bind(this),
      this.disconnect_cb.bind(this))
    this.robotConnected = false
    this.pageBuilt = false
    this.driveMode = false
    this.messageMask = document.getElementById('mask')
    this.cameraFrames = document.getElementById('mainImage')

    this.widgetArray = null
    this.configSettings = null
    this.getConfiguration(this.buildPage.bind(this))

    this.setupSocketEvents()
    console.log('RQMain instantiated')
  }

  hideWidgetHolder () {
    const me = document.getElementsByClassName('toggleWidgetHolder')[0]
    document.getElementById('widgetHolder').style.left = '-260px'
    this.widgetHolderOpen = false
    me.style.left = '5px'
    me.innerText = 'Show'
  }

  showWidgetHolder () {
    const me = document.getElementsByClassName('toggleWidgetHolder')[0]
    document.getElementById('widgetHolder').style.left = '0px'
    this.widgetHolderOpen = true
    me.style.left = '192px'
    me.innerText = 'Hide'
  }

  toggleWidgetHolder () {
    if (!this.inDriveMode) {
      if (this.widgetHolderOpen) {
        this.hideWidgetHolder()
      } else {
        this.showWidgetHolder()
      }
    }
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
   */
  getConfiguration (buildPage) {
    const configRequest = new XMLHttpRequest()
    configRequest.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        buildPage(JSON.parse(configRequest.responseText))
      }
    }
    configRequest.open('GET', RQ_PARAMS.CONFIG_FILE, true)
    configRequest.send()
  }

  /**
   * Set or reset the visibility of a widget.
   *
   * @param {string} visibilityMode - The string 'visible' or 'hidden'.
   */
  setWidgetsVisibility (visibilityMode) {
    for (let i = 0; i < this.widgetArray.length; i++) {
      const widget = document.getElementById(this.widgetArray[i].id)
      widget.style.visibility = visibilityMode
      if (this.widgetArray[i].type === '_rosImage') {
        set4style(widget, widgetArray[i])
      }
    }
    document.getElementsByClassName('toggleWidgetHolder')[0]
      .style
      .visibility = visibilityMode
  }

  /**
   * runCmdFromInput
   *
   */
  runCmdFromInput () {
    console.log('runCmdFromInput() called')
  }

  /**
   * connectToSerial
   *
   * @param {element} argument - Unknown
   */
  connectToSerial (argument) {
    console.log('connectToSerial() called')
  }

  /**
   * openConfig
   *
   * @param {this object} argument - Unknown
   */
  openConfig (argument) {
    console.log('openConfig() called')
  }

  /**
   * applyConfigChanges
   */
  applyConfigChanges (argument) {
    console.log('applyConfigChanges() called')
  }

  /**
   * removeWidgetFromScreen
   *
   * @param {element} element - Unknown
   */
  removeWidgetFromScreen (element) {
    console.log('removeWidgetFromScreen() called')

    let deleteList = []
    const WA = widgetArray[indexMap[element.id]]

    // TODO: Why the following?
    // socket.emit('shutROS',WA.topic)

    if (WA.type === '_box' && WA.childids) {
      deleteList = WA.childids
    }
    if (WA.type === '_serial') {
      if (element.serialObject) {
        element.serialObject.end()
      }
    }
    element.remove()
    deleteWidget(element.id)
    deleteFromPanel(element.id)

    for (let i = 0; i < deleteList.length; i++) {
      element = document.getElementById(deleteList[i])
      const WA = widgetArray[indexMap[element.id]]
      socket.emit('shutROS', WA.topic)
      if (WA.type === '_serial') {
        if (element.serialObject) element.serialObject.end()
      }
      element.remove()
      deleteWidget(element.id)
      deleteFromPanel(element.id)
    }
  }

  /**
   * restartServer
   *
   * @param {integer} argument - Unknown
   */
  restartServer (argument) {
    console.log('restartServer() called')
  }

  /**
   * closeOtherClients
   */
  closeOtherClients () {
    console.log('closeOtherClients() called')
  }

  /**
   * clearTerminal
   */
  clearTerminal () {
    console.log('clearTerminal() called')
  }

  /**
   * openTerminal
   */
  openTerminal () {
    console.log('openTerminal() called')
  }

  /**
   * closeTerminal
   */
  closeTerminal () {
    console.log('closeTerminal() called')
  }

  /**
   * hideHelp
   */
  hideHelp () {
    console.log('hideHelp() called')
  }

  /**
   * toggleHelp
   */
  toggleHelp () {
    console.log('toggleHelp() called')
  }

  /**
   * toggleFullscreen
   */
  toggleFullscreen () {
    console.log('toggleFullScreen() called')
  }

  /**
   * Update the application software on the robot.
   */
  updateSoftware () {
    console.log('updateSoftware() called')

    const updateText = document.getElementById('updateText')
  }

  /**
   * Toggle between drive mode and no-drive mode, changing the visibility
   * of the widgets appropriately.
   */
  toggleDriveMode () {
    if (this.driveMode) {
      this.driveMode = false
      const dm = document.getElementById('driveModeButton')
      dm.innerText = 'Drive'

      this.setWidgetsVisibility('visible')
    } else {
      this.driveMode = true
      const dm = document.getElementById('driveModeButton')
      dm.innerText = 'Edit'
      this.hideWidgetHolder()
      this.setWidgetsVisibility('hidden')
    }
  }

  /**
   * Define the contents of the RQ page using the contents of
   * the configuration file.
   *
   * First, remove all of the dynamic elements, which are identified with
   * the class "panel" and "dragable". Next, set some names and background
   * colors. Lastly, iterate through this.widgetArray calling addWidget()
   * for each member.
   *
   * The intent of the class "panel dragable" is not (yet) clear, since there
   * aren't any in the initial HTML page.
   *
   * If the configuration says to start in edit mode or if the browser
   * is identified as a "mobile" device, either toggle drive mode or
   * show the widget holder.
   *
   * @param {JSON} configuration - The contents of the configuration file.
   */
  buildPage (configuration) {
    if (!this.pageBuilt) {
      this.configSettings = configuration.config
      this.widgetArray = configuration.widgets

      if (!this.configSettings || !this.widgetArray) {
        console.log(`Neither configSettings nor widgetArray found in: ${configuration}`)
        return
      }

      const allDynamicElements = document.getElementsByClassName('panel dragable')
      for (let i = allDynamicElements.length - 1; i >= 0; i--) {
        allDynamicElements[i].remove()
      }

      document.getElementById('consoleName').innerText = this.configSettings.consoleName
      document.getElementById('title').innerText = this.configSettings.consoleName
      document.getElementById('body').style.backgroundColor = this.configSettings.background
      const snapWidgets = this.configSettings.snaptogrid

      for (const widgetConfig of this.widgetArray) {
        this.addWidget(widgetConfig)
      }
      if (!this.configSettings.loadInEditMode || isMobile()) {
        this.toggleDriveMode()
      } else {
        this.showWidgetHolder()
      }

      this.pageBuilt = true
    }
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
    this.show_message(
      'Connected to the robot',
      false,
      RQ_PARAMS.MESSAGE_DURATION_S)
  }

  /**
   * Responds when the socket connection is lost.
   */
  disconnect_cb () {
    this.robotConnected = false
    this.show_message('Robot disconnected', false)
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
} // RQMain

const rqMain = new RQMain()

setInterval(rqMain.send_heartbeat.bind(rqMain), 10000)
