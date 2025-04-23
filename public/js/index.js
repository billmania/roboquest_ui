'use strict'

/* global jQuery io RQ_PARAMS KeyControl ServoConfig */
/* global positionWidgets createWidget initWidgetConfig */
/* global RQUpdateHelp RQRebootHelp RQShutdownHelp */
/* global setMsgDialogOpen setMsgDialogClosed */
/* global showMsg gamepad ros */
/* global appendAttribute */

/**
 * The main control for the RoboQuest front-end UI.
 */

console.info(`rq_ui version ${RQ_PARAMS.VERSION} starting`)
console.info(`rq_ui config format version ${RQ_PARAMS.CONFIG_FORMAT_VERSION}`)
console.info(`isSecureContext ${isSecureContext}`)

ros.checkMaps()

const keyControl = new KeyControl('#keyControl')
const servoConfig = new ServoConfig()
let updating = null
let rebooting = null
let stopping = null
let softwareVersions = null
let sequenceSent = 0

jQuery(window).on('resize', function () {
  positionWidgets()
})

jQuery(document).ready(function () {
  console.log('Checking for duplicate IDs')

  jQuery('[id]')
    .each(function () {
      const ids = jQuery('[id="' + this.id + '"]')
      if (ids.length > 1 && ids[0] === this) {
        console.warn('Multiple IDs #' + this.id)
        console.warn(
          `ID ${this.id} is duplicated`
        )
      }
    })
})

const initSocket = function () {
  const objSocket = io(`${window.location.hostname}:${window.location.port}`,
    {
      transports: ['websocket'],
      upgrade: false,
      pingTimeout: RQ_PARAMS.PING_TIMEOUT_MS,
      pingInterval: RQ_PARAMS.PING_INTERVAL_MS,
      timeout: RQ_PARAMS.SOCKET_TIMEOUT_MS
    }
  )

  const imgDisconnected = new Image()
  imgDisconnected.src = RQ_PARAMS.DISCONNECTED_IMAGE

  objSocket.on('disconnect', (strReason) => {
    console.warn('Connection to the robot has been lost. ', strReason)
    jQuery('#mainImage').attr('src', imgDisconnected.src)
  })

  objSocket.on('probeEcho', (probeEcho) => {
    console.debug('Received probeEcho')
  })

  objSocket.on('mainImage', (bufImage) => {
    try {
      const uint8Buffer = new Uint8Array(bufImage)
      let strBuffer = ''
      /*
       * This brute-forcing the conversion is due to Chromium's problem
       * with too many arguments on the stack when using the ... operator.
       */
      for (let i = 0; i < uint8Buffer.byteLength; i++) {
        strBuffer += String.fromCharCode(uint8Buffer[i])
      }
      const strImage = btoa(strBuffer)
      document.getElementById('mainImage').src = `data:image/jpeg;base64,${strImage}`
    } catch (error) {
      console.warn(
        'mainImage:' +
        ` ${error.name}|${error.message}` +
        `, bytes| ${bufImage.byteLength}`
      )
    }
  })

  objSocket.on('connect', () => {
    console.info('Connection to the robot established.')
    updating = false
  })
  objSocket.on('connect_error', (objError) => {
    console.error('Error connecting to robot. ', objError)
  })

  return objSocket
}

/**
 * Remove any existing options from the chooseCamera dropdown
 * menu and then add an option for each camera in cameras.
 */
const chooseCamera = function () {
  jQuery('#chooseCamera')
    .find('option')
    .remove()

  // TODO: Populate cameras with the list of actually available cameras
  const cameras = ['camera0', 'camera1', 'camera2', 'camera3']
  let nextOption = null
  jQuery.each(cameras, function (i, camera) {
    nextOption = jQuery('<option>', {
      value: i,
      text: camera
    })
    jQuery('#chooseCamera').append(nextOption)
  })
}

jQuery(function () {
  const objSocket = initSocket()

  initWidgetConfig(objSocket)
  chooseCamera()
  jQuery('#chooseCamera').change(function () {
    const newCamera = jQuery('#chooseCamera').find('option:selected').val()
    console.debug(`chooseCamera: ${newCamera}`)
    objSocket.emit('choose_camera', newCamera)
  })

  /**
   * Save the configuration object. Called by clicking the "save config" button
   * and by KeyControl.
   */
  const saveConfig = function () {
    const objSaveConfig = {
      widgets: []
    }
    jQuery('.widget').each((i, element) => {
      objSaveConfig.widgets.push(jQuery(element).getWidgetConfiguration())
    })
    jQuery.ajax({
      type: 'POST',
      url: '/config',
      contentType: 'application/json',
      data: JSON.stringify(objSaveConfig),
      success: function (objResponse) {
        console.debug('Save Config Response', objResponse)
      },
      error: function (objRequest, strStatus, strError) {
        console.error('Error saving config:', strError)
      }
    })
  }

  /**
   * Execute the process for re-configuring the collection of keys
   * assigned to widgets.
   */
  const configKeys = function () {
    keyControl.getKeyedWidgets()

    jQuery('#configKeysDialog').dialog('open')
  }

  /**
   * Execute the process for re-configuring the servos.
   */
  const configServos = function () {
    jQuery('#chooseServoDialog').dialog('open')
  }

  /**
   * Show the versions of the software components.
   *
   * @param {string} divId - HTML element ID for the table
   * @param {object} versions - version details
   */
  const populateSoftwareVersions = function (divId, versions) {
    const divSelector = '#' + divId
    let table = '<table><tbody>'
    table += '<tr><th>Component</th><th>Installed</th><th>Latest</th></tr>\n'
    for (const entry in versions.installed) {
      table += '<tr>'
      table += `<td>${entry}</td>`
      table += `<td>${versions.installed[entry]}</td>`
      table += `<td>${versions.latest[entry]}</td>`
      table += '</tr>\n'
    }
    table = table + '</tbody></table>'
    jQuery(divSelector).html(table)
  }

  /**
   * Add the help steps to the list.
   *
   * @param {string} listId - HTML element ID for the list
   * @param {Array} helpSteps - array of the help steps
   */
  const populateHelpList = function (listId, helpSteps) {
    const listSelector = '#' + listId
    jQuery(listSelector).empty()
    for (const step of helpSteps) {
      jQuery(listSelector).append(
        jQuery('<li>').append(
          step
        )
      )
    }
  }

  let statusIntervalId
  const statusUrl = (
    'https' +
    `://${window.location.host}` +
    `:${RQ_PARAMS.STATUS_PORT}` +
    `/${RQ_PARAMS.STATUS_FILE}`
  )
  console.debug(`statusUrl: ${statusUrl}`)

  const showStatusEntries = function () {
    jQuery.ajax({
      url: statusUrl,
      success: function (data) {
        jQuery('#updateStatusP')
          .html(data.replaceAll('\n', '<br>'))
      }
    })
  }

  jQuery('#updateStatusDialog').dialog({
    title: 'Software update log',
    width: 400,
    height: 500,
    maxHeight: 800,
    maxWidth: 900,
    autoOpen: false,
    open: function (event, ui) {
      statusIntervalId = setInterval(showStatusEntries, RQ_PARAMS.STATUS_INTERVAL_MS)
      console.debug(
        'updateStatusDialog: opened'
      )
    },
    close: function (event, ui) {
      if (statusIntervalId !== undefined) {
        clearInterval(statusIntervalId)
        statusIntervalId = undefined
      }
      console.debug(
        'updateStatusDialog: closed'
      )
    }
  })

  jQuery('#updateSoftwareDialog').dialog({
    title: 'Update RoboQuest software',
    width: 400,
    autoOpen: false,
    buttons: {
      Update: function () {
        if (updating) {
          showMsg('Update already started')
          return
        }

        if (objSocket.connected) {
          updating = true

          objSocket.emit('control_hat', '{"set_charger": "ON"}')
          const intTimeS = Math.round(Date.now() / 1000)
          objSocket.emit(
            'update',
            `{"timestamp":"${intTimeS}", "version":"${RQ_PARAMS.UPDATE_FORMAT_VERSION}", "action":"UPDATE", "args":"UI"}`
          )
        } else {
          console.error(
            'Not connected to the robot so an UPDATE is not possible. Check the robot.'
          )
        }
      }
    },
    open: function (event, ui) {
      jQuery('#updateStatusDialog').dialog('open')
    }
  })
  jQuery('#rebootRobotDialog').dialog({
    title: 'Reboot robot',
    width: 400,
    autoOpen: false,
    buttons: {
      Reboot: function () {
        if (rebooting) {
          showMsg('Reboot already started')
          return
        }

        if (objSocket.connected) {
          rebooting = true

          const intTimeS = Math.round(Date.now() / 1000)
          objSocket.emit(
            'update',
            `{"timestamp":"${intTimeS}", "version":"${RQ_PARAMS.UPDATE_FORMAT_VERSION}", "action":"REBOOT", "args":"UI"}`
          )
        } else {
          showMsg(
            'Not connected to the robot so an UPDATE is not possible. Check the robot.'
          )
        }
      }
    }
  })
  jQuery('#shutdownRobotDialog').dialog({
    title: 'Shutdown robot',
    width: 400,
    autoOpen: false,
    buttons: {
      Shutdown: function () {
        if (stopping) {
          showMsg('Shutdown already started')
          return
        }

        if (objSocket.connected) {
          stopping = true

          const intTimeS = Math.round(Date.now() / 1000)
          objSocket.emit(
            'update',
            `{"timestamp":"${intTimeS}", "version":"${RQ_PARAMS.UPDATE_FORMAT_VERSION}", "action":"SHUTDOWN", "args":"UI"}`
          )
        } else {
          showMsg(
            'Not connected to the robot so a SHUTDOWN is not possible. Check the robot.'
          )
        }
      }
    }
  })

  jQuery('#chooseServoDialog').dialog({
    width: 300,
    autoOpen: false,
    buttons: {
      Edit: function () {
        jQuery('#configServoDialog').dialog('open')
      },
      Done: function () {
        // TODO: Verify the format and consistency of the ServoConfig method names
        servoConfig.save_servos()
        console.debug('chooseServoDialog: emitting restart')
        // TODO: Add a check if anything actually changed in the servo config
        objSocket.emit(
          'restart',
          '{}'
        )
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      servoConfig.fetch_config()
    }
  })

  jQuery('#configServoDialog').dialog({
    width: 500,
    autoOpen: false,
    buttons: {
      Apply: function () {
        servoConfig.apply_servo_config()
      },
      Done: function () {
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      servoConfig.show_servo_config()
    }
  })

  jQuery('#keysHelpDialog').dialog({
    width: 300,
    autoOpen: false,
    buttons: {
      Close: function () {
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      jQuery('#keysHelpWidgetType').text(keyControl.getWidgetType())
      jQuery('#keysHelpText').text(keyControl.getHelpText())
    }
  })

  jQuery('#configKeysDialog').dialog({
    width: 500,
    autoOpen: false,
    buttons: {
      Done: function () {
        keyControl.rebuildKeyMap()
        saveConfig()
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      jQuery('#menuDialog').dialog('close')
      jQuery('#configKeysWidgetTable').html(keyControl.showWidgets())
    }
  })

  jQuery('#widgetKeysDialog').dialog({
    width: 800,
    autoOpen: false,
    buttons: {
      Help: function () {
        jQuery('#keysHelpDialog').dialog('open')
      },
      AddKey: keyControl.addKeyRow.bind(keyControl),
      Apply: keyControl.applyKeycodeConfig.bind(keyControl),
      Done: function () {
        jQuery(this).dialog('close')
        jQuery('#keysHelpDialog').dialog('close')
        jQuery('#configKeysDialog').dialog('open')
      }
    },
    open: function (event, ui) {
      jQuery('#configKeysDialog').dialog('close')
      jQuery('#widgetKeysLabel').text(keyControl.configureWidgetLabel())
      jQuery('#widgetKeysForm').html(keyControl.showKeycodes())
    }
  })

  jQuery('#msgDialog').dialog({
    width: 200,
    autoOpen: false,
    open: function (event, ui) {
      setMsgDialogOpen()
    },
    close: function (event, ui) {
      setMsgDialogClosed()
    }
  })
  jQuery('#gamepadAttributePicker').dialog({
    width: 250,
    autoOpen: false,
    buttons: {
      Append: function () {
        gamepad.appendAttribute()
      },
      Check: function () {
        gamepad.checkAttributes()
      }
    }
  })
  jQuery('#widgetAttributePicker').dialog({
    width: 250,
    autoOpen: false,
    buttons: {
      Append: function () {
        appendAttribute()
      }
    }
  })
  jQuery('#menuDialog').dialog({
    width: 500,
    autoOpen: false,
    open: function (event, ui) {
      jQuery('#newWidget').dialog('close')
    }
  })
  jQuery('#configure').on('click', function () {
    jQuery('#menuDialog').dialog('open')
  })
  jQuery('#configKeys').on('click', configKeys)
  jQuery('#saveConfig').on('click', saveConfig)
  jQuery('#configServos').on('click', configServos)

  jQuery('#updateSoftware').on('click', function () {
    jQuery('#menuDialog').dialog('close')
    populateHelpList('updateSoftwareList', RQUpdateHelp.steps)
    populateSoftwareVersions('softwareVersions', softwareVersions)
    jQuery('#updateSoftwareDialog').dialog('open')
  })
  jQuery('#rebootRobot').on('click', function () {
    jQuery('#menuDialog').dialog('close')
    populateHelpList('rebootRobotList', RQRebootHelp.steps)
    jQuery('#rebootRobotDialog').dialog('open')
  })
  jQuery('#shutdownRobot').on('click', function () {
    jQuery('#menuDialog').dialog('close')
    populateHelpList('shutdownRobotList', RQShutdownHelp.steps)
    jQuery('#shutdownRobotDialog').dialog('open')
  })

  jQuery('#trash').droppable({
    accept: '.widget',
    tolerance: 'pointer',
    classes: {
      'ui-droppable-hover': 'trash-drop-hover'
    },
    drop: function (event, ui) {
      ui.draggable.remove()
      positionWidgets()
    }
  })

  jQuery.ajax({
    url: RQ_PARAMS.CONFIG_FILE,
    dataType: 'json',
    success: function (data) {
      jQuery.each(data.widgets, function (i, widget) {
        createWidget(widget, objSocket)
      })
      positionWidgets()
    }
  })

  jQuery.ajax({
    url: RQ_PARAMS.VERSIONS_FILE,
    dataType: 'json',
    success: function (data) {
      softwareVersions = data
    }
  })

  /**
   * Send a probe object to the backend. Insert the next sequence
   * number and the current timestamp.
   *
   * Called by an interval timer.
   */
  const sendLoadProbe = function () {
    const sequence = sequenceSent + 1
    const currentTimestamp = Date.now()

    objSocket.emit('loadProbe', `{"sequence": ${sequence}, "timestamp": ${currentTimestamp}}`)
    sequenceSent = sequence
    console.debug(`sendLoadProbe: ${sequenceSent}`)
  }
  setInterval(sendLoadProbe, RQ_PARAMS.PROBE_PERIOD_MS)
})
