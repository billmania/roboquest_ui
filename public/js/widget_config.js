'use strict'

/* global jQuery RQ_PARAMS keyControl */
/* global gamepad GamepadData ROW_ID_LENGTH */
/* global showMsg */

/*
 * A socket object is required to create a widget, so we need to define
 * it globally here to avoid a circular scope dependency.
*/
let socket

const WIDGET_TYPES = [
  'button',
  'gamepad',
  'indicator',
  'joystick',
  'slider',
  'value'
]

/*
 * So the widget default configuration can be shown for a new
 * widget but not for an existing widget.
 */
let showConfigDefaults = true
/*
 * Used to tell other logic that the widget configuration process is
 * active. An example is the Gamepad class, so it can determine what to
 * do with gamepad events.
 */
let configuringWidget = false // eslint-disable-line no-unused-vars

/**
 * Extends jQuery. To be called on a jQuery element of class 'widget'.
 *
 *  @returns {object} - a complete widget configuration object.
 */
jQuery.fn.getWidgetConfiguration = function () {
  return this.data(RQ_PARAMS.WIDGET_NAMESPACE)
}

/**
 * Reset all of the Format and Robot Communications input elements
 * to ''.
 */
const resetConfigInputs = function () {
  jQuery('#newWidget')
    .find('[data-section]')
    .each((i, element) => {
      const dataSection = jQuery(element).data('section')

      if (dataSection === 'data') {
        console.debug(
          'resetConfigInputs:' +
          ` localName: ${element.localName}` +
          ` name: ${element.name}` +
          ` value: ${element.value}`
        )
        element.value = ''
      }
    })
  /*
   * Reset the select element to the blank option.
   */
  jQuery('#newWidgetType').val('').selectmenu('refresh')
}

/**
 * Determine the greatest widget ID integer already assigned to a widget.
 * Return that integer + 1. ID numbers must be non-negative.
 *
 *  @returns {number} - the next widget ID
 */
const getNextId = function () { // eslint-disable-line no-unused-vars
  let greatestId = -1
  jQuery('.widget').each((i, element) => {
    const widgetId = parseInt(jQuery(element).getWidgetConfiguration().id)
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
    const objWidget = jQuery(element).getWidgetConfiguration()
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
 *    an HTML DIV with the CSS class "widget" and widgetType. it also
 *    has an HTML ID unique to this widget
 * 2. the widgetContainer includes a widgetHeader which shows the
 *    widget's label
 * 3. the widgetContainer lastly includes the widgetContent. the content
 *    is an HTML DIV with the CSS class "widget-content".
 *
 */
const createWidget = function (objWidget) { // eslint-disable-line no-unused-vars
  // TODO: Instead of using upper case widget names for unique-ness, use the
  // TODO: rq widget namespace.
  const widgetTypeUpper = objWidget.type.toUpperCase()

  if (objWidget.id === undefined ||
      objWidget.id === '' ||
      objWidget.label === undefined ||
      objWidget.label === '') {
    console.warn(
      'createWidget:' +
      ` widget ${JSON.stringify(objWidget)} must have both` +
      ' a unique id and a unique, non-blank label'
    )
    showMsg(
      'Widgets must have both' +
      ' a unique id and a unique, non-blank label'
    )

    return
  }

  const safeLabel = getSafeLabel(objWidget.label)
  // TODO: Figure out how to replace the string 'widget' with a constant
  const widgetContainer = jQuery(
    `<div class="widget ${widgetTypeUpper}" id="${safeLabel}"></div>`
  )
  const widgetHeader = jQuery(
    '<div class="widget-header">' + objWidget.label + '</div>'
  )
  const widgetKebobMenu = jQuery(
    '<img class="widget-kebobMenu" src="img/kebobMenu.png"/>'
  )
  const widgetContent = jQuery(
    '<div class="widget-content"></div>'
  )

  widgetKebobMenu.appendTo(widgetContainer)
  widgetHeader.appendTo(widgetContainer)
  widgetContent.appendTo(widgetContainer)

  if (Object.hasOwn(objWidget, 'keys')) {
    keyControl.addKeysForWidget(objWidget) // eslint-disable-line no-undef
  }

  /*
   * Store the widget configuration object (objWidget) under the
   * WIDGET_NAMESPACE in an arbitrary jQuery data unit attached
   * to the widgetContainer.
   */
  jQuery(widgetContainer).data(RQ_PARAMS.WIDGET_NAMESPACE, objWidget)

  console.debug(`createWidget: ${JSON.stringify(objWidget)}`)

  jQuery(widgetContainer)[widgetTypeUpper](
    { ...objWidget, socket }
  ).appendTo(
    '#widgets'
  ).draggable({
    handle: '.widget-header',
    snap: true,
    stop: function (event, ui) {
      const widgetId = event.target.id
      const widgetData = jQuery('#' + widgetId).getWidgetConfiguration()

      if (!widgetData) {
        /*
         * The widgetData no longer exists, likely because the widget
         * was deleted from the UI. That condition is acceptable here.
         */
        return
      }

      const widgetPosition = widgetData.position

      jQuery('#' + widgetId).getWidgetConfiguration().position = updateWidgetPosition(
        widgetPosition,
        jQuery('#' + widgetId).position()
      )
      console.debug(
        ` updated position to: ${JSON.stringify(jQuery('#' + widgetId).getWidgetConfiguration().position)}`
      )
    }
  }).hover(function (event) {
    jQuery(event.currentTarget).find('.widget-kebobMenu')[0].style.display = 'block'
  },
  function (event) {
    jQuery(event.currentTarget).find('.widget-kebobMenu')[0].style.display = 'none'
  })

  widgetKebobMenu.on('click', function (event) {
    openConfigureWidgetDialog(jQuery(event.target.closest('.widget')))
  })

  widgetHeader.on('dblclick', function (event) {
    openConfigureWidgetDialog(jQuery(event.target.closest('.widget')))
  })
}

/**
 * Change the configuration of an existing widget, using the same
 * form used to add a widget.
 *
 * @param {object} widget - describes the widget being re-configured
 */
const openConfigureWidgetDialog = function (widget) {
  const oldWidgetConfig = widget.getWidgetConfiguration()

  populateWidgetConfigurationDialog(oldWidgetConfig)

  showConfigDefaults = false
  jQuery('#newWidget').dialog({
    title: 'Configure Widget',
    buttons: {
      Cancel: function () {
        jQuery(this).dialog('close')
      },
      Done: function () {
        reconfigureWidget(
          oldWidgetConfig,
          extractWidgetConfigurationFromDialog()
        )
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      keyControl.disableKeys()
      configuringWidget = true
      console.debug('configuringWidget is true')
    },
    close: function (event, ui) {
      /*
       * Executed by clicking the X or Cancel on the (re)Configure Widget
       * dialog, regardless of widget type. Also by calling dialog.close().
       */
      configuringWidget = false
      console.debug('configuringWidget is false')
    }
  }).dialog('open')
}

/**
 * Remove all jQuery selector special characters.
 * Replace all SPACE and COMMA characters with underscores.

 *
 * @param {string} label - the original label
 *
 * @returns {string} - the safe version of the label
 */
const getSafeLabel = function (label) {
  return (
    label
      .replace(/[ ,]{1,}/g, '_')
      .replace(/['"#.!?]{1,}/g, '')
  )
}

/**
 * Look through the collection of widget configurations for
 * newLabel, ignoring widgetId. If newLabel is assigned to some
 * other widget, return true.
 *
 * @param {number} changedWidgetId - the id of the widget being changed
 * @param {string} newLabel - the requested new widget label
 *
 * @returns {boolean} - true if newLabel is already assigned
 */
const labelNotUnique = function (changedWidgetId, newLabel) {
  const widgets = jQuery('.widget')
  for (const widget of widgets) {
    const widgetConfig = jQuery(widget).getWidgetConfiguration()
    if (widgetConfig.id !== changedWidgetId &&
        widgetConfig.label === newLabel) {
      return true
    }
  }

  return false
}

/*
 * If the updated widget doesn't have a label which is already in use,
 * re-use the same id, position, and keys. Delete the old widget and
 * re-create it using the updated configuration. No checking is done
 * to determine if anything actually changed.
 */
const reconfigureWidget = function (oldWidgetConfig, newWidgetConfig) {
  if (newWidgetConfig.label === undefined) {
    showMsg('Widget must have a label')
    return
  }

  newWidgetConfig.label = newWidgetConfig.label.replace(/['"]g/, '')

  const oldDragableWidget = jQuery('#' + getSafeLabel(oldWidgetConfig.label))
  if (labelNotUnique(oldWidgetConfig.id, newWidgetConfig.label)) {
    console.warn(
      'reconfigureWidget:' +
      ` label ${newWidgetConfig.label} already in use.` +
      ' Rejecting the change'
    )
    showMsg(`Label ${newWidgetConfig.label} already in use`)
    return
  }

  if (newWidgetConfig.label === undefined ||
      newWidgetConfig.label === '') {
    console.warn(
      'reconfigureWidget:' +
      ` widget ${JSON.stringify(newWidgetConfig)} must have` +
      ' a unique, non-blank label.' +
      ' Rejecting the change'
    )
    showMsg(
      `${newWidgetConfig.id} must have` +
      ' a unique, non-blank label.'
    )

    return
  }
  oldDragableWidget.remove()
  positionWidgets()

  newWidgetConfig.id = oldWidgetConfig.id
  newWidgetConfig.position = oldWidgetConfig.position
  createWidget(newWidgetConfig)
  if (Object.hasOwn(oldWidgetConfig, 'keys')) {
    /*
     * The configuration of widgets keys is handled separately from
     * the configuration of the widget itself. Therefore the keys
     * configuration must be preserved here.
     */
    newWidgetConfig.keys = oldWidgetConfig.keys
    keyControl.rebuildKeyMap()
  }
  positionWidgets()
}

/**
 * In the widget configuration dialog, set the input element default
 * values based on the selected widget type.
 * The global variable showConfigDefaults prevents over-writing an
 * existing configuration with the defaults.
 */
// TODO: Constrain configuration using widgetInterface based on widgetType
const setWidgetConfigDefaults = function () {
  if (showConfigDefaults) {
    const widgetType = jQuery('#newWidget #newWidgetType').find('option:selected').val()
    if (WIDGET_TYPES.includes(widgetType)) {
      console.debug(`setWidgetConfigDefaults: ${JSON.stringify(widgetDefaults[widgetType])}`)
      populateWidgetConfigurationDialog(widgetDefaults[widgetType])
    }
    return
  }
  showConfigDefaults = true
}

/**
 * Adjust the newWidget dialog to show only the relevant input elements,
 * based on the selected widget type. Set the default value for each input,
 * using the object of defaults for the widget type.
 *
 * @param {string} widgetType - the type of widget from [Button, Value,
 *                              Slider, Indicator, Joystick, Gamepad]
 */
const setNewWidgetDialogType = function (widgetType) {
  jQuery('#newWidget .newWidgetType').hide()
  if (WIDGET_TYPES.includes(widgetType)) {
    jQuery(`#newWidget #${widgetType}`).show()
    if (widgetType === 'gamepad') {
      if (gamepad.gamepadConnected()) {
        gamepad.enableGamepad()
      } else {
        showMsg('No gamepad connected')
        console.warn('setNewWidgetDialogType: No gamepad connected')
      }
    }
  }
}

/**
 * Used when adding a new widget and re-configuring an existing widget.
 *
 * @param {object} widgetConfig - the current configuration when
 *                                reconfiguring OR the default
 *                                values when adding a new widget
 *
 * If widgetConfig.type === undefined, this is a new widget,
 * otherwise it's an existing widget being reconfigured.
 *
 */
const populateWidgetConfigurationDialog = function (widgetConfig) {
  if (widgetConfig === undefined) {
    return
  }

  if (widgetConfig.type === 'gamepad') {
    /*
     * Re-configuring an existing gamepad widget.
     */
    gamepad.parseConfig(widgetConfig)
  }

  jQuery('#newWidget')
    .find('[data-section]')
    .each((i, element) => {
      const dataSection = jQuery(element).data('section')

      switch (dataSection) {
        case 'root': {
          if (Object.hasOwn(widgetConfig, element.name)) {
            if (element.name === 'type') {
              jQuery('#newWidgetType')
                .val(widgetConfig[element.name])
                .selectmenu('refresh')
              setNewWidgetDialogType(widgetConfig[element.name])
            } else {
              element.value = widgetConfig[element.name]
            }
          }
          break
        }

        case 'format': {
          if (Object.hasOwn(widgetConfig[dataSection], element.name)) {
            element.value = widgetConfig[dataSection][element.name]
          }
          break
        }

        case 'data': {
          if (widgetConfig.type !== 'gamepad') {
            if (Object.hasOwn(widgetConfig[dataSection], element.name)) {
              const configValue = widgetConfig[dataSection][element.name]
              if (typeof (configValue) === 'object' &&
                  Array.isArray(configValue)) {
                element.value = configValue.join(RQ_PARAMS.ATTR_DELIMIT)
              } else {
                element.value = configValue
              }
            }
          } else {
            element.value = gamepad.getElementValue(element.name)
          }

          break
        }
      }
    })
}

/*
* Reads all the populated fields of the configuration dialog into an object
*
* The data-sections of the input elements contained by the
* #configureNewWidget element are expected to be in order as
* root, position, format, and data. The data elements for a gamepad
* are expected to be in order as description, destinationType,
* destinationName, interface, attributes, and scaling. Input elements
* are processed only when their value is none of: null, false, '', or
* undefined. Any gamepad data-section entry which is not completely
* defined will be logged and then ignored.
*
* @returns {object} - returns a configuration object assembled from the
*                     dialog's current state
*/
const extractWidgetConfigurationFromDialog = function () {
  const objNewWidget = {
    position: {},
    format: {},
    data: {}
  }
  let gamepadData = null
  let rowId = null
  jQuery('#newWidget')
    .find(
      '#configureNewWidget input:visible' +
      ', #configureNewWidget select:visible' +
      ', #newWidgetType'
    )
    .each((i, element) => {
      /*
       * The 'root' data-section elements must be found
       * before any 'data' data-section elements, so the widget
       * type will already be known when the first 'data' element
       * is processed.
       */
      if (element.value) {
        const dataSection = jQuery(element).data('section')

        switch (dataSection) {
          case 'root': {
            objNewWidget[element.name] = element.value
            if (objNewWidget.type === 'gamepad') {
              if (!Array.isArray(objNewWidget.data)) {
                objNewWidget.data = []
              }
            }
            break
          }

          case 'position': {
            /*
             * Defined in index.htm but not currently used.
             */
            break
          }

          case 'format': {
            /*
             * Some format values are integers.
             */
            const value = parseInt(element.value)
            if (isNaN(value)) {
              objNewWidget[dataSection][element.name] = element.value
            } else {
              objNewWidget[dataSection][element.name] = value
            }
            break
          }

          case 'data': {
            if (objNewWidget.type !== 'gamepad') {
              /*
                 * Elements, such as topicAttribute and scale, may contain
                 * multiple items. When found, assemble them into an Array
                 * of strings.
                 */
              if (element.value.indexOf(RQ_PARAMS.ATTR_DELIMIT) > -1) {
                const attributes = element.value
                  .replaceAll(' ', '')
                  .split(RQ_PARAMS.ATTR_DELIMIT)
                objNewWidget[dataSection][element.name] = attributes
              } else {
                objNewWidget[dataSection][element.name] = element.value
              }
            } else {
              /*
               * gamepad 'data' consists of multiple sets of inputs.
               * They're grouped by the first ROW_ID_LENGTH characters of
               * the input name. They're assembled and added to the
               * objNewWidget.data property as an Array of "data" objects
               * instead of a single "data" object.
               */
              if (!gamepadData) {
                gamepadData = new GamepadData()
                objNewWidget.data = []
              }

              rowId = element.name.slice(0, ROW_ID_LENGTH)
              if (gamepadData.getRow() &&
                  rowId !== gamepadData.getRow()) {
                try {
                  objNewWidget.data.push(gamepadData.getDataObject())
                } catch (error) {
                  console.warn(
                  `${error.name}:${error.message}` +
                  ` on ${gamepadData.getRow()}`
                  )
                }
                gamepadData = new GamepadData()
              }

              try {
                gamepadData.addElement(element.name, element.value)
              } catch (error) {
                console.warn(
                  'extractWidgetConfigurationFromDialog:' +
                  ` ${error.name}` +
                  ` ${error.message}`
                )
              }
            }
            break
          }
        }
      }
    })

  /*
   * Take care of the last data object.
   */
  if (gamepadData &&
      gamepadData.getRow()) {
    try {
      objNewWidget.data.push(gamepadData.getDataObject())
    } catch (error) {
      console.warn(
        `${error.name}:${error.message}` +
        ` on ${gamepadData.getRow()}`
      )
    }
    gamepadData = null
  }

  // these are one off logic to string concat the values, not a nice 1-1 mapping
  objNewWidget.position.my = `${jQuery('#widgetPositionMyX').val()} ${jQuery('#widgetPositionMyY').val()}`
  objNewWidget.position.at = `${jQuery('#parentPositionAtX').val()} ${jQuery('#parentPositionAtY').val()}`

  return objNewWidget
}

/**
 * Manage the ROS configuration of a widget.
 */
const rosConfiguration = function (genericArg) { // eslint-disable-line no-unused-vars
  console.debug(`rosConfiguration: ${JSON.stringify(genericArg)}`)
}

const initWidgetConfig = function (objSocket) { // eslint-disable-line no-unused-vars
  socket = objSocket
  /**
   * Use the details of a new widget, collected via the configuration menu, to
   * instantiate and position a new widget.
   * It's called by clicking the "Create" button in the "Configure a New Widget"
   * form which implies this function needs a better name.
   */
  // TODO: Give this function a more intuitive name based on its use and effect
  const addWidget = function () {
    const objNewWidget = extractWidgetConfigurationFromDialog()
    objNewWidget.label = objNewWidget.label.replace(/['"]/g, '')

    if (objNewWidget.type === 'gamepad') {
      gamepad.disableGamepad()
    }
    objNewWidget.id = getNextId()

    createWidget(objNewWidget)
    configuringWidget = false
    console.debug('configuringWidget is false')
    positionWidgets()
  }

  /*
   * TODO:
   * Why is this newWidget dialog defined here and then redefined
   * when the addWidget button is clicked?
   */
  jQuery('#newWidget').dialog({
    width: 500,
    autoOpen: false,
    buttons: {
      Create: addWidget,
      Done: function () {
        console.debug('Done newWidget dialog')
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      jQuery('#menuDialog').dialog('close')
    },
    close: function (event, ui) {
      gamepad.disableGamepad()
    }
  })

  /**
   * Capture changes to the widget configuration type.
   */
  jQuery('#newWidget #newWidgetType').selectmenu({
    change: function (event, ui) {
      const widgetType = ui.item.value

      rosConfiguration(widgetType)

      setWidgetConfigDefaults()
      setNewWidgetDialogType(widgetType)
    }
  })

  jQuery('#addWidget').on('click', function () {
    /*
     * The #newWidget dialog is used to define a new widget which
     * doesn't yet exist in the widget configuration file.
     */
    jQuery('#newWidget').dialog({
      title: 'Configure a New Widget',
      buttons: {
        Create: addWidget,
        Done: function () {
          jQuery(this).dialog('close')
        }
      },
      open: function (event, ui) {
        resetConfigInputs()
        setNewWidgetDialogType('')
        keyControl.disableKeys()
        setWidgetConfigDefaults()
        configuringWidget = true
      },
      close: function (event, ui) {
        gamepad.disableGamepad()
      }
    }).dialog('open')
  })
}

/*
 * Default configuration values for each type of widget. The properties
 * of widgetDefaults are the widget types. The properties under each widget
 * type are the name attribute of the input elements in the
 * configureNewWidget form.
 * Each widget type object must have both a "format" and a "data" property.
 */
const widgetDefaults = {
  button: {
    label: 'buttonX',
    format: {
      text: ''
    },
    data: {
      service: '',
      serviceType: 'rq_msgs/srv',
      serviceAttribute: '',
      clickValue: ''
    }
  },
  slider: {
    label: 'sliderX',
    format: {
      min: 0,
      max: 180,
      step: 10,
      reversed: 'no',
      default: 90,
      orientation: 'horizontal',
      animate: 'true'
    },
    data: {
      topicDirection: 'publish',
      topic: '',
      topicType: 'rq_msgs/msg',
      topicAttribute: ''
    }
  },
  value: {
    label: 'valueX',
    format: {
      textColor: '#CCC',
      prefix: ' ',
      suffix: ' '
    },
    data: {
      topicDirection: 'subscribe',
      topic: '',
      topicType: 'rq_msgs/msg',
      topicAttribute: ''
    }
  },
  indicator: {
    label: 'indicatorX',
    format: {
      trueText: 'True',
      trueColor: '#DDD',
      falseText: 'False',
      falseColor: '#EEE'
    },
    data: {
      topicDirection: 'subscribe',
      topic: '',
      topicType: 'rq_msgs/msg',
      topicAttribute: ''
    }
  },
  joystick: {
    label: 'joystickX',
    format: {},
    data: {
      scale: '1;1',
      topicPeriodS: 3,
      topicDirection: 'publish',
      topic: 'cmd_vel',
      topicType: 'geometry_msgs/msg/TwistStamped',
      topicAttribute: 'twist.angular.z;twist.linear.x'
    }
  },
  gamepad: {
    label: 'gamepadX',
    format: {},
    data: {}
  }
}

/*
 * The widget_interface object is used similarly to the objects in src/ros_interfaces.js.
 * It defines the allowed service, topic, and attributes allowed for each widget
 * type.
 * Widgets are more constrained than the gamepad. There aren't any widgets which have
 * the option of either a topic or a service.
 */
const widgetInterface = {
  button: {
    service: {
      control_hat: {
        'rq_msgs/srv/Control': [
          'set_motors:ON',
          'set_servos:ON',
          'set_fet1:ON',
          'set_fet2:ON',
          'set_charger:ON'
        ]
      }
    }
  },

  slider: {
    topic: {
      publish: {
        motor_speed: {
          'rq_msgs/msg/MotorSpeed': [
            'max_rpm'
          ]
        },

        servos: {
          'rq_msgs/msg/Servos': [
            'servo0.angle_deg;servo0.command_type:1',
            'servo1.angle_deg;servo1.command_type:1',
            'servo2.angle_deg;servo2.command_type:1',
            'servo3.angle_deg;servo3.command_type:1',
            'servo4.angle_deg;servo4.command_type:1',
            'servo5.angle_deg;servo5.command_type:1',
            'servo6.angle_deg;servo6.command_type:1',
            'servo7.angle_deg;servo7.command_type:1',
            'servo8.angle_deg;servo8.command_type:1',
            'servo9.angle_deg;servo9.command_type:1',
            'servo10.angle_deg;servo10.command_type:1',
            'servo11.angle_deg;servo11.command_type:1',
            'servo12.angle_deg;servo12.command_type:1',
            'servo13.angle_deg;servo13.command_type:1',
            'servo14.angle_deg;servo14.command_type:1',
            'servo15.angle_deg;servo15.command_type:1'
          ]
        }
      }
    }
  },

  value: {
    topic: {
      subscribe: {
        telemetry: {
          'rq_msgs/msg/Telemetry': [
            'battery_v',
            'battery_ma',
            'system_ma',
            'adc0_v',
            'adc1_v',
            'adc2_v',
            'adc3_v',
            'adc4_v'
          ]
        }
      }
    }
  },

  indicator: {
    topic: {
      subscribe: {
        telemetry: {
          'rq_msgs/msg/Telemetry': [
            'charger_has_power',
            'battery_charging',
            'motors_on',
            'servos_on'
          ]
        }
      }
    }
  },

  joystick: {
    topic: {
      publish: {
        servos: {
          'rq_msgs/msg/Servos': [
            'servo0.speed_dps;servo0.command_type:3',
            'servo1.speed_dps;servo1.command_type:3',
            'servo2.speed_dps;servo2.command_type:3',
            'servo3.speed_dps;servo3.command_type:3',
            'servo4.speed_dps;servo4.command_type:3',
            'servo5.speed_dps;servo5.command_type:3',
            'servo6.speed_dps;servo6.command_type:3',
            'servo7.speed_dps;servo7.command_type:3',
            'servo8.speed_dps;servo8.command_type:3',
            'servo9.speed_dps;servo9.command_type:3',
            'servo10.speed_dps;servo10.command_type:3',
            'servo11.speed_dps;servo11.command_type:3',
            'servo12.speed_dps;servo12.command_type:3',
            'servo13.speed_dps;servo13.command_type:3',
            'servo14.speed_dps;servo14.command_type:3',
            'servo15.speed_dps;servo15.command_type:3'
          ]
        },

        cmd_vel: {
          'geometry_msgs/msg/TwistStamped': [
            'twist.angular.z;twist.linear.x'
          ]
        }
      }
    }
  }
}
