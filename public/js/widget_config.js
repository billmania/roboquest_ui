'use strict'

/* global jQuery RQ_PARAMS keyControl */

/*
 * A socket object is required to create a widget, so we need to define
 * it globally here to avoid a circular scope dependency.
*/
let socket

/*
 * Differentiate between using the widget configuration form for a
 * new widget and for re-configuring an existing widget.
 */
let reconfiguringWidget = false

/**
 * Extends jQuery. To be called on a jQuery element of class 'widget'.
 *
 *  @returns {object} - a complete widget configuration object.
 */
jQuery.fn.getWidgetConfiguration = function () {
  return this.data(RQ_PARAMS.WIDGET_NAMESPACE)
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
 *    and HTML DIV with the CSS class "widget" and widgetType. it also
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

  // TODO: Figure out how to replace the string 'widget' with a constant
  const widgetContainer = jQuery(
    `<div class="widget ${widgetTypeUpper}" id="${objWidget.label}"></div>`
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
   * Store the widget configuration object (objWidget) under the WIDGET_NAMESPACE
   * in an arbetrary jQuery data unit attatched to the widgetContainer
   */
  jQuery(widgetContainer).data(RQ_PARAMS.WIDGET_NAMESPACE, objWidget)

  console.debug(`${JSON.stringify(objWidget)}`)

  jQuery(widgetContainer)[widgetTypeUpper](
    { ...objWidget, socket }
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
      const widgetData = jQuery('#' + widgetId).getWidgetConfiguration()

      if (!widgetData) {
        /*
         * The widgetData no longer exists, likely because the widget was deleted from the UI. That condition
         * is acceptable here.
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

  reconfiguringWidget = true
  jQuery('#newWidget').dialog({
    title: 'Configure Widget',
    buttons: {
      Cancel: function () {
        jQuery(this).dialog('close')
      },
      Done: function () {
        reconfigureWidget(oldWidgetConfig, extractWidgetConfigurationFromDialog())
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      keyControl.disableKeys()
    }
  }).dialog('open')
}

/*
* @returns {object} - the dragable jQuery widget element
*/
// TODO: Find better way to identify widgets than using their label
const getjQueryWidgetFromConfig = function (widgetConfig) {
  return jQuery('#' + widgetConfig.label)
}

/*
 * Simply delete the widget and re-create it with the new config settings
 */
// TODO: Call an "update" method on the widget before defaulting to this method
const reconfigureWidget = function (oldWidgetConfig, newWidgetConfig) {
  const oldDragableWidget = getjQueryWidgetFromConfig(oldWidgetConfig)

  oldDragableWidget.remove()
  positionWidgets()

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
 * The global variable reconfiguringWidget prevents over-writing an
 * existing configuration with the defaults.
 */
const setWidgetConfigDefaults = function () {
  if (reconfiguringWidget) {
    reconfiguringWidget = false
    return
  }

  const widgetType = jQuery('#newWidget #newWidgetType').find('option:selected').val()
  populateWidgetConfigurationDialog(widgetDefaults[widgetType])
}

/**
 * Adjust the newWidget dialog to show only the relevant input elements,
 * based on the selected widget type. Set the default value for each input,
 * using the object of defaults for the widget type.
 *
 * @param {string} widgetType - the type of widget from [Button, Value,
 *                              Slider, Indicator, Joystick]
 */
const setNewWidgetDialogType = function (widgetType) {
  jQuery('#newWidget .newWidgetType').hide()
  jQuery(`#newWidget #${widgetType}`).show()

  // TODO: Don't believe it's necessary to call positionWidgets() here
  // positionWidgets()
}

/**
 * Used when re-configuring an existing widget.
 *
 * @param {object} widgetConfig - the current configuration to use as
 *                                default values.
 */
const populateWidgetConfigurationDialog = function (widgetConfig) {
  jQuery('#newWidget').find('[data-section]').each((i, element) => {
    const strPropSection = jQuery(element).data('section')

    if (strPropSection === 'root') {
      if (Object.hasOwn(widgetConfig, element.name)) {
        if (element.name === 'type') {
          jQuery('#newWidgetType').val(widgetConfig[element.name]).selectmenu('refresh')
          setNewWidgetDialogType(widgetConfig[element.name])
        } else {
          element.value = widgetConfig[element.name]
        }
      }
    }

    if (strPropSection === 'format') {
      if (Object.hasOwn(widgetConfig[strPropSection], element.name)) {
        element.value = widgetConfig[strPropSection][element.name]
      }
    }

    if (strPropSection === 'data') {
      if (Object.hasOwn(widgetConfig[strPropSection], element.name)) {
        const configValue = widgetConfig[strPropSection][element.name]
        if (typeof (configValue) === 'object' && Array.isArray(configValue)) {
          element.value = configValue.join(RQ_PARAMS.ATTR_DELIMIT)
        } else {
          element.value = configValue
        }
      }
    }
  })
}

/*
* Reads all the populated fields of the configuration dialog into an object
*
* @returns {object} - returns a configuration object assembled from the dialog's current state
*/
const extractWidgetConfigurationFromDialog = function () {
  const objNewWidget = {
    position: {},
    format: {},
    data: {}
  }
  jQuery('#newWidget')
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
             * Elements, such as topicAttribute and scale, may contain
             * multiple items. When found, assemble them into an Array
             * of strings.
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

  return objNewWidget
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

    objNewWidget.id = getNextId()

    createWidget(objNewWidget)
    positionWidgets()
  }

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

  jQuery('#newWidget #newWidgetType').selectmenu({
    change: function (event, ui) {
      const widgetType = ui.item.value

      setWidgetConfigDefaults()
      setNewWidgetDialogType(widgetType)
    }
  })

  jQuery('#addWidget').on('click', function () {
    jQuery('#newWidget').dialog({
      title: 'Configure a New Widget',
      buttons: {
        Create: addWidget,
        Done: function () {
          jQuery(this).dialog('close')
        }
      },
      open: function (event, ui) {
        keyControl.disableKeys()
        setWidgetConfigDefaults()
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
      topicType: 'rq_msgs/msg/TwistStamped',
      topicAttribute: 'twist.angular.z;twist.linear.x'
    }
  }
}
