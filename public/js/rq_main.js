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
   * Set the style of the widget using its description.
   *
   * @param {} tile -
   * @param {JSON} widget - The JSON object describing the widget.
   */
  setWidgetStyle (tile, widget) {
    if (widget.useTop) {
      tile.style.top = widget.top
      tile.style.bottom = ''
    } else {
      tile.style.top = ''
      tile.style.bottom = widget.bottom
    }
    if (widget.useLeft) {
      tile.style.right = ''
      tile.style.left = widget.left
    } else {
      tile.style.left = ''
      tile.style.right = widget.right
    }
    tile.style.width = widget.w
    tile.style.height = widget.h

    if (widget.type === '_rosImage') {
      this.styleImageWidget(tile, widget)
    }
  }

  /**
   * Find the widget element from the widget menu and duplicate it.
   * Returns a new widget-clone as a dragable half-functional widget.
   *
   * @param {string} widgetId - The ID of the widget.
   *
   * @returns {} - A clone of the widget.
   */
  widgetFromId (widgetId) {
    const widgetItem = document.getElementById(widgetId)
    if (!widgetItem) {
      console.log(`widget with ID ${widgetId} does not exist`)
      return
    }

    const widgetClone = widgetItem.cloneNode(true)
    widgetClone.className = 'panel dragable'
    widgetClone.style.zIndex = 60
    if (widgetId === '_box') {
      widgetClone.style.zIndex = 5
    }
    widgetClone.querySelector('#header').style = 'padding:11px;'
    widgetClone.querySelector('#header').childNodes[0].data = ''
    widgetClone.id = ''

    // show the gear icon to allow for configuration of that widget
    widgetClone.querySelector('#configButton').style.display = 'inline-block'

    let canvas = widgetClone.querySelector('#canvas_ap')
    if (canvas) {
      initJoystick(canvas)
      drawJoystick(canvas, 0, 0, false)
    }
    /*
    canvas = widgetClone.querySelector('#gauge_ap')
    if (canvas) {
      // TODO: Implement
      // drawGauge(canvas, 0)
    }
    canvas = widgetClone.querySelector('#arm_ap')
    if (canvas) {
      // TODO: Implement
      // drawArm(canvas)
    }
     */
    document.getElementById('body').appendChild(widgetClone)

    return widgetClone
  }

  /**
   * Use the JSON definition of a widget to configure it on the page.
   *
   * @param {JSON} widget - The JSON object which describes the widget.
   */
  addWidget (widget) {
    const type = widget.type
    let canvas = null
    let imageAp = null

    if (!type) {
      console.log(`widget ${widget} does not have a type so cannot be created`)
      return
    }
    console.log(`creating widget ${widget} as ${type}`)
    const tile = this.widgetFromId(type)
    if (!tile) {
      console.log(`widget type ${type} doesn't exist in this version of UI`)
      return
    }

    // assign some properties
    tile.id = widget.id
    tile.style.zIndex = 20
    if (type === '_box') tile.style.zIndex = 5

    tile.style.width = widget.w
    tile.style.height = widget.h

    // customize the widget with information from the json array
    switch (type) {
      case '_button':
        tile.querySelector('#button_ap').innerText = widget.label
        if (widget.fontsize) tile.querySelector('#button_ap').style.fontSize = parseFloat(widget.fontsize) + 'px'
        break

      case '_checkbox':
        tile.querySelector('#checkbox_text_ap').innerText = widget.label
        tile.querySelector('#checkbox_ap').checked = widget.initial
        tile.querySelector('#checkbox_text_ap').style.color = widget.textColor
        // TODO: Implement
        /*
        if (widget.latching) {
          sendToRos(
            widget.topic,
            { value: widget.initial ? widget.onPress : widget.onRelease },
            '_checkbox')
        }
         */
        break

      case '_joystick':
        canvas = tile.querySelector('#canvas_ap')
        canvas.height = parseInt(widget.h) - 20
        canvas.width = parseInt(widget.w)
        // TODO: Implement
        // drawJoystick(canvas, 0, 0)
        break

      case '_trigger':
        tile.querySelector('#paddle_background').style.background = widget.back
        tile.querySelector('#paddle_ap').style.background = widget.bar
        break

      case '_slider':
        tile.querySelector('#slider_ap').min = widget.min
        tile.querySelector('#slider_ap').max = widget.max
        tile.querySelector('#slider_ap').value = (parseInt(widget.min) + parseInt(widget.max)) / 2
        tile.querySelector('#slider_ap').step = widget.step
        break

      case '_value':
        tile.querySelector('#text_ap').innerText = 'Waiting for ROS...'
        tile.querySelector('#text_ap').style.color = widget.textColor
        break

      case '_light':
        tile.querySelector('#text_ap').innerText = widget.text
        break

      case '_audio':
        tile.querySelector('#speaker_ap').className = widget.hideondrive ? '' : 'showOnDrive'
        break

      case '_gauge':
        canvas = tile.querySelector('#gauge_ap')
        canvas.height = parseInt(widget.h) - 20
        canvas.width = parseInt(widget.w)
        canvas.setAttribute('data-config', JSON.stringify({ min: widget.min, max: widget.max, bigtick: widget.bigtick, smalltick: widget.smalltick, title: widget.label }))
        // TODO: Implement
        // drawGauge(canvas, widget.min, widget)
        break

      case '_rosImage':
        imageAp = tile.querySelector('#imageAp')
        if (widget.src) imageAp.src = widget.src
        if (widget.aspr) imageAp.className = 'showOnDrive containImage'
        if (widget.opac) imageAp.style.opacity = widget.opac + '%'
        break

      case '_arm':
        canvas = tile.querySelector('#arm_ap')
        canvas.height = parseInt(widget.h) - 20
        canvas.width = parseInt(widget.w)
        // TODO: Implement
        // drawArm(canvas, widget.arms)
        break

      case '_dropdown':
        // TODO: Implement
        // tile.querySelector('#selector_ap').innerHTML = generateSelectorOptions(widget.dropdowns)
        break

      case '_text':
        tile.querySelector('#text_ap').innerText = widget.text
        tile.querySelector('#text_ap').style.color = widget.textColor
        break

      case '_box':
        tile.querySelector('#panel_ap').style.backgroundColor = widget.bkColor
        break

      case '_speaker':
        tile.querySelector('#label_ap').innerText = widget.label || ''
        break
    }

    this.setWidgetStyle(tile, widget)

    // TODO: Implement
    // initFunctionality(widget.type, tile, tile.id)
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

      for (const widget of this.widgetArray) {
        this.addWidget(widget)
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
