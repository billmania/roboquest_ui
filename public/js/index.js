'use strict'

/* global jQuery io RQ_PARAMS KeyControl positionWidgets createWidget initWidgetConfig ServoConfig */

/**
 * The main control for the RoboQuest front-end UI.
 */

console.info(`rq_ui version ${RQ_PARAMS.VERSION} starting`)
console.info(`rq_ui config format version ${RQ_PARAMS.CONFIG_FORMAT_VERSION}`)

const keyControl = new KeyControl('#keyControl')
const servoConfig = new ServoConfig()

jQuery(window).on('resize', function () {
  positionWidgets()
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
  objSocket.on('connect', () => {
    console.info('Connection to the robot established.')
  })
  objSocket.on('connect_error', (objError) => {
    console.error('Error connecting to robot. ', objError)
  })

  // need to have the image loaded before disconnect or else we cant request it when disconnected
  const imgDisconnected = new Image()
  imgDisconnected.src = RQ_PARAMS.DISCONNECTED_IMAGE

  objSocket.on('disconnect', (strReason) => {
    console.warn('Connection to the robot has been lost. ', strReason)
    jQuery('#mainImage').attr('src', imgDisconnected.src)
  })

  objSocket.on('mainImage', (bufImage) => {
    const strImage = btoa(String.fromCharCode(...new Uint8Array(bufImage)))
    document.getElementById('mainImage').src = `data:image/jpeg;base64,${strImage}`
  })

  return objSocket
}

const initMisc = function (objSocket) {
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
    if (objSocket.connected) {
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
  })

  jQuery('#trash').droppable({
    accept: '.widget',
    classes: {
      'ui-droppable-hover': 'trash-drop-hover'
    },
    drop: function (event, ui) {
      console.debug('dropped ID ', ui.draggable.getWidgetConfiguration().id)
      ui.draggable.remove()
      // TODO: Not sure positionWidgets is required here
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
}

jQuery(function () {
  const objSocket = initSocket()

  initWidgetConfig(objSocket)
  initMisc(objSocket)
})
