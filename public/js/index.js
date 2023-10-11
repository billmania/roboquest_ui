'use strict'

/* global jQuery io RQ_PARAMS KeyControl */

/**
 * The main control for the RoboQuest front-end UI.
 */

console.info(`rq_ui version ${RQ_PARAMS.VERSION} starting`)
console.info(`rq_ui config format version ${RQ_PARAMS.CONFIG_FORMAT_VERSION}`)

const keyControl = new KeyControl('#keyControl')

/**
 * Determine the greatest widget ID integer already assigned to a widget.
 * Return that integer + 1. ID numbers must be non-negative.
 *
 *  @returns {number} - the next widget ID
 */
const getNextId = function () {
  let greatestId = -1
  jQuery('.widget').each((i, element) => {
    const widgetId = parseInt(jQuery(element).data('widget').id)
    if (widgetId > greatestId) {
      greatestId = widgetId
    }
  })

  return greatestId + 1
}

/**
 * Used in two scenarios: the first time the page is rendered; every time
 * the page is resized. The function uses the widgets' configuration from
 * the configuration file which was saved using the jQuery.data() function.
 * Added widgets must have their configuration added via jQuery.data() too.
 *
 *  CSS element selectors reminder:
 *  . find the collection of elements with this CSS class attribute
 *  # find the element with this unique HTML ID attribute
 *  * find the collection of every HTML element on the page
 *
 */
const positionWidgets = function () {
  jQuery('.widget').each((i, element) => {
    const objWidget = jQuery(element).data('widget')
    jQuery(element).position({
      ...objWidget.position,
      of: '#widgets',
      collision: 'none none'
    })
  })
}

jQuery(window).on('resize', function () {
  positionWidgets()
})

/**
 * Update the recorded position of the widget with newPosition.
 *
 * @param {object} oldPosition - the old, complete position
 * @param {object} newPosition - the new top and left offset
 *
 * @returns {object} - a complete position object
 */
const updateWidgetPosition = function (oldPosition, newPosition) {
  oldPosition.at = `left+${newPosition.left} top+${newPosition.top}`
  return oldPosition
}

/**
 * Instantiate a widget defined in the configuration file or
 * via the configuration menu.
 *
 * The widget's configuration label attribute is used to find a specific
 * widget.
 *
 * The structure of a new widget is comprised of three parts:
 * 1. the top level, all-encompassing element is a widgetContainer and is
 *    and HTML DIV with the CSS class "widget" and widgetType. it also
 *    has an HTML ID unique to this widget
 * 2. the widgetContainer includes a widgetHeader which shows the
 *    widget's label
 * 3. the widgetContainer lastly includes the widgetContent. the content
 *    is an HTML DIV with the CSS class "widget-content".
 *
 */
const createWidget = function (objWidget, objSocket) {
  // TODO: Instead of using upper case widget names for unique-ness, use the
  // TODO: rq widget namespace.
  const widgetTypeUpper = objWidget.type.toUpperCase()

  // TODO: Figure out how to replace the string 'widget' with a constant
  const widgetContainer = jQuery(
    `<div class="widget ${widgetTypeUpper}" id="${objWidget.label}"></div>`
  )
  const widgetHeader = '<div class="widget-header">' + objWidget.label + '</div>'
  const widgetContent = '<div class="widget-content"></div>'
  jQuery(widgetHeader).appendTo(widgetContainer)
  jQuery(widgetContent).appendTo(widgetContainer)

  if (Object.hasOwn(objWidget, 'keys')) {
    keyControl.addKeysForWidget(objWidget)
  }

  /*
   * In this function call, the string "widget" is not a class name
   * but is instead the key for a jQuery arbitrary data storage object.
   *
   * TODO: Replace "widget" with a more meaningful name.
   */
  jQuery(widgetContainer).data('widget', objWidget)

  console.debug(`${JSON.stringify(objWidget)}`)

  jQuery(widgetContainer)[widgetTypeUpper](
    { ...objWidget, socket: objSocket }
  ).appendTo(
    '#widgets'
  ).draggable({
    handle: '.widget-header',
    snap: true,
    start: function (event, ui) {
      const widgetId = event.currentTarget.id
      console.debug(
        `drag started on ${widgetId}` +
        ` at position ${JSON.stringify(jQuery('#' + widgetId).position())}` +
        ` and offset ${JSON.stringify(jQuery('#' + widgetId).offset())}`
      )
    },
    stop: function (event, ui) {
      const widgetId = event.target.id
      const widgetPosition = jQuery('#' + widgetId).data('widget').position
      console.debug(
        `drag stopped on ${widgetId}` +
        ` at offset ${JSON.stringify(jQuery('#' + widgetId).offset())}` +
        ` and position ${JSON.stringify(jQuery('#' + widgetId).position())}` +
        ` original ${JSON.stringify(widgetPosition)}`
      )

      jQuery('#' + widgetId).data('widget').position = updateWidgetPosition(
        widgetPosition,
        jQuery('#' + widgetId).position()
      )
      console.debug(
        ` updated position to: ${JSON.stringify(jQuery('#' + widgetId).data('widget').position)}`
      )
    }
  })
}

jQuery(function () {
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

  /**
   * Use the details of a new widget, collected via the configuration menu, to
   * instantiate and position a new widget.
   * It's called by clicking the "Create" button in the "Configure a New Widget"
   * form which implies this function needs a better name.
   */
  // TODO: Give this function a more intuitive name based on its use and effect
  const addWidget = function () {
    const objNewWidget = {
      position: {},
      format: {},
      data: {}
    }
    jQuery(this)
      .find(
        '#configureNewWidget input:visible, #configureNewWidget select:visible, #newWidgetType'
      )
      .each((i, element) => {
        // TODO: Provide a reasonable default value for element.value
        if (element.value) {
          const strPropSection = jQuery(element).data('section')
          console.debug(strPropSection, element.name, element.value)
          if (strPropSection === 'root') {
            objNewWidget[element.name] = element.value
          }
          if (strPropSection === 'format') {
            /*
             * Some format values are integers.
             */
            const value = parseInt(element.value)
            if (isNaN(value)) {
              objNewWidget[strPropSection][element.name] = element.value
            } else {
              objNewWidget[strPropSection][element.name] = value
            }
          }
          if (strPropSection === 'data') {
            /*
             * The topicAttribute element may contain multiple attributes.
             * When found, assemble them into an Array of strings.
             */
            if (element.value.indexOf(RQ_PARAMS.ATTR_DELIMIT) > -1) {
              const attributes = element.value
                .replaceAll(' ', '')
                .split(RQ_PARAMS.ATTR_DELIMIT)
              objNewWidget[strPropSection][element.name] = attributes
            } else {
              objNewWidget[strPropSection][element.name] = element.value
            }
          }
        }
      })
    // these are one off logic to string concat the values, not a nice 1-1 mapping
    objNewWidget.position.my = `${jQuery('#widgetPositionMyX').val()} ${jQuery('#widgetPositionMyY').val()}`
    objNewWidget.position.at = `${jQuery('#parentPositionAtX').val()} ${jQuery('#parentPositionAtY').val()}`
    objNewWidget.id = getNextId()

    createWidget(objNewWidget, objSocket)
    positionWidgets()
  }

  /**
   * Save the configuration object. Called by clicking the "save config" button
   * and by KeyControl.
   */
  const saveConfig = function () {
    const objSaveConfig = {
      widgets: []
    }
    jQuery('.widget').each((i, element) => {
      objSaveConfig.widgets.push(jQuery(element).data('widget'))
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

  // TODO: Reload the (re)assigned keys on the close event
  jQuery('#configKeysDialog').dialog({
    width: 500,
    autoOpen: false,
    buttons: {
      Done: function () {
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      jQuery('#menuDialog').dialog('close')
      jQuery('#configKeysDefined').text('Defined keys: ' + keyControl.getKeysSet())
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

  jQuery('#newWidget').dialog({
    width: 500,
    autoOpen: false,
    buttons: {
      Create: addWidget,
      Done: function () {
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      jQuery('#menuDialog').dialog('close')
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
  jQuery('#addWidget').on('click', function () {
    jQuery('#newWidget').dialog('open')
  })
  jQuery('#configKeys').on('click', configKeys)
  jQuery('#saveConfig').on('click', saveConfig)

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

  jQuery('#newWidget #newWidgetType').selectmenu({
    change: function (event, ui) {
      const widgetType = ui.item.value
      jQuery('#newWidget .newWidgetType').hide()
      jQuery(`#newWidget #${widgetType}`).show()
    }
  })

  jQuery('#trash').droppable({
    accept: '.widget',
    drop: function (event, ui) {
      console.debug('dropped ID ', ui.draggable.data('widget').id)
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
})
