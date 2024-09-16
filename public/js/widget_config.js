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

const RECONFIG = true
const ADD = false

/*
 * Used to tell other logic that the widget configuration process is
 * active. An example is the Gamepad class, so it can determine what to
 * do with gamepad events.
 */
let configuringWidget = false // eslint-disable-line no-unused-vars

let activeWidgetAttributesElementId = ''

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

  populateWidgetConfigurationDialog(RECONFIG, oldWidgetConfig.type, oldWidgetConfig)

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
    },
    close: function (event, ui) {
      /*
       * Executed by clicking the X or Cancel on the (re)Configure Widget
       * dialog, regardless of widget type. Also by calling dialog.close().
       */
      configuringWidget = false
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
 * Show the configuration elements for only the specified widgetType.
 */
const showConfigurationElements = function (widgetType) {
  jQuery('#newWidget .newWidgetType').hide()
  if (WIDGET_TYPES.includes(widgetType)) {
    jQuery(`#newWidget #${widgetType}`).show()
  } else {
    if (widgetType === '') {
      return
    }

    console.warn(
      'showconfigurationElements:' +
      ` ${widgetType} must be from ${WIDGET_TYPES}`
    )
  }
}

/**
 * Adjust the newWidget dialog to show only the relevant input elements,
 * based on the selected widget type. Cause those elements to be populated
 * appropriately.
 *
 * @param {string} widgetType - the type of widget from [Button, Value,
 *                              Slider, Indicator, Joystick, Gamepad]
 */
const setNewWidgetDialogType = function (widgetType) {
  showConfigurationElements(widgetType)

  if (widgetType === '') {
    return
  }

  if (widgetType === 'gamepad') {
    if (gamepad.gamepadConnected()) {
      gamepad.enableGamepad()
    } else {
      showMsg('No gamepad connected')
      console.warn('setNewWidgetDialogType: No gamepad connected')
    }
  } else {
    populateWidgetConfigurationDialog(ADD, widgetType)
  }
}

/**
 * Setup the SELECT and INPUT elements in the #configureNewWidgetForm
 * for the specified widgetType.
 *
 * @param (string) widgetType - one of the members of WIDGET_TYPES,
 *                              except gamepad
 */
const setupWidgetDataSection = function (widgetType) {
  if (widgetType === 'gamepad') {
    return
  }

  if (!WIDGET_TYPES.includes(widgetType)) {
    console.warn(
      'setupWidgetDataSection:' +
      ` ${widgetType} must be from ${WIDGET_TYPES}`
    )
  }

  /*
   * Find the SELECT elements in the data section for this widgetType,
   * remove all OPTIONs, add a blank OPTION, and then add more OPTIONs
   * based on widgetInterface.
   * Find the INPUT elements and erase any content.
   */
  let widgetOptions
  let destinationType
  if (Object.hasOwn(widgetInterface[widgetType], 'topic')) {
    widgetOptions = widgetInterface[widgetType].topic
    destinationType = 'topic'
  } else {
    widgetOptions = widgetInterface[widgetType].service
    destinationType = 'service'
  }

  const widgetTypeClass = '.' + widgetType + 'Class'
  jQuery(widgetTypeClass)
    .find('[data-section=data]')
    .each((i, element) => {
      if (element.localName === 'select') {
        const dataElement = jQuery('[name=' + element.name + ']')
        switch (destinationType) {
          case 'service': {
            switch (element.name) {
              case 'service': {
                dataElement.empty()
                dataElement.append('<option value=""></option>')
                for (const serviceName in widgetOptions) {
                  dataElement.append(`<option value="${serviceName}">${serviceName}</option>`)
                }
                break
              }
            }
            break
          }

          case 'topic': {
            switch (element.name) {
              case 'topicDirection': {
                dataElement.empty()
                dataElement.append('<option value=""></option>')
                for (const topicDirection in widgetOptions) {
                  dataElement.append(`<option value="${topicDirection}">${topicDirection}</option>`)
                }
                break
              }
            }
            break
          }
        }
      } else {
        element.value = ''
      }
    })
}

/**
 * When adding a new widget or re-configuring an existing widget, the data section
 * elements are populated based on the widgetType property in the widgetInterface
 * object.
 * When re-configuring an existing widget, all of configuration dialog elements
 * are set based on the widget's current configuration. If the widget type is changed
 * while reconfiguring, the process will convert to the add-a-new-widget process.
 *
 * @param {boolean} reconfig - true if reconfiguring, otherwise adding
 * @param {string} widgetType - one of WIDGET_TYPES
 * @param {object} widgetConfig - the current configuration when
 *                                reconfiguring
 */
const populateWidgetConfigurationDialog = function (reconfig, widgetType, widgetConfig) {
  if (![RECONFIG, ADD].includes(reconfig)) {
    console.warn(
      'populateWidgetConfigurationDialog:' +
      ' reconfig must be RECONFIG or ADD'
    )
    return
  }

  if (reconfig && widgetType === 'gamepad') {
    /*
     * Re-configuring an existing gamepad widget.
     */
    gamepad.parseConfig(widgetConfig)
  }

  if (reconfig) {
    showConfigurationElements(widgetType)
  }

  setupWidgetDataSection(widgetType)

  const widgetClass = '.allWidgetsClass, .' + widgetType + 'Class'
  jQuery(widgetClass)
    .find('[data-section]')
    .each((i, element) => {
      const dataSection = jQuery(element).data('section')

      switch (dataSection) {
        case 'root': {
          if (reconfig && Object.hasOwn(widgetConfig, element.name)) {
            if (element.name === 'type') {
              jQuery('#newWidgetType')
                .val(widgetConfig[element.name])
                .selectmenu('refresh')
            } else {
              element.value = widgetConfig[element.name]
            }
          }
          break
        }

        case 'format': {
          if (reconfig && Object.hasOwn(widgetConfig[dataSection], element.name)) {
            element.value = widgetConfig[dataSection][element.name]
          }
          break
        }

        case 'data': {
          if (widgetType !== 'gamepad') {
            if (reconfig && Object.hasOwn(widgetConfig[dataSection], element.name)) {
              const configValue = widgetConfig[dataSection][element.name]
              if (typeof (configValue) === 'object' &&
                  Array.isArray(configValue)) {
                /*
                 * Only attributes are handled this way and they don't
                 * use a SELECT element.
                 */
                element.value = configValue.join(RQ_PARAMS.ATTR_DELIMIT)
              } else {
                /*
                 * This configValue could be assigned to an INPUT element
                 * or to a SELECT element.
                 */
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
* #configureNewWidgetForm element are expected to be in order as
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
      '#configureNewWidgetForm input:visible' +
      ', #configureNewWidgetForm select:visible' +
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

const setupTopicAttributeSelect = function (widgetType, topicName, direction, interfaceType) {
  for (const attribute of widgetInterface[widgetType].topic[direction][topicName][interfaceType]) {
    jQuery('#widgetAttributeSelect')
      .append(`<option value="${attribute}">${attribute}</option>`)
  }
}

const setupServiceAttributeSelect = function (widgetType, serviceName, interfaceType) {
  for (const attribute of widgetInterface[widgetType].service[serviceName][interfaceType]) {
    jQuery('#widgetAttributeSelect')
      .append(`<option value="${attribute}">${attribute}</option>`)
  }
}

/**
 * Show the list of attributes for a widget using a dialog, very similar to
 * Gamepad.showAttributes().
 */
const showAttributes = function (sourceElement) { // eslint-disable-line no-unused-vars
  const identifiers = sourceElement.id.split('-')
  if (identifiers.length !== 2) {
    return
  }

  activeWidgetAttributesElementId = sourceElement.id

  const widgetType = identifiers[0]
  const attributeElementName = identifiers[1]
  console.debug(
    'showAttributes:' +
    ` widgetType: ${widgetType}` +
    ` attributeElement: ${attributeElementName}`
  )

  jQuery(`#${widgetType}-topicAttribute`).val('')
  jQuery(`#${widgetType}-serviceAttribute`).val('')
  jQuery('#widgetAttributeSelect').empty()

  if (attributeElementName.startsWith('topic')) {
    const topicDirection = jQuery(`#${widgetType}-topicDirection`).val()
    const topic = jQuery(`#${widgetType}-topic`).val()
    const interfaceType = jQuery(`#${widgetType}-topicType`).val()

    setupTopicAttributeSelect(widgetType, topic, topicDirection, interfaceType)
  } else if (attributeElementName.startsWith('service')) {
    const service = jQuery(`#${widgetType}-service`).val()
    const interfaceType = jQuery(`#${widgetType}-serviceType`).val()
    setupServiceAttributeSelect(widgetType, service, interfaceType)
  } else {
    console.warn(
      'showAttributes:' +
      `cannot find topic or service in ${attributeElementName}`
    )
    return
  }

  jQuery('#widgetAttributePicker').dialog({ title: `${widgetType} attributes` })
  jQuery('#widgetAttributePicker').dialog('open')
}

/**
 * Append the selected attribute to the collection of attributes.
 */
const appendAttribute = function () { // eslint-disable-line no-unused-vars
  console.debug('appendAttribute')

  const selectedAttribute = jQuery('#widgetAttributeSelect').val()
  if (selectedAttribute === undefined || selectedAttribute === '') {
    return
  }

  const attributesElement = jQuery(`#${activeWidgetAttributesElementId}`)
  let attributes = attributesElement.val()

  if (attributes !== '') {
    attributes += ';'
  }
  attributes += selectedAttribute
  attributesElement.val(attributes)
}

/**
 * Confirm the collection of attributes are valid.
 */
const checkAttributes = function () { // eslint-disable-line no-unused-vars
  console.debug('checkAttributes')
}

/**
 * Called after a serviceName is selected from the service element. Use the
 * serviceName as the property in configDetails.service[serviceName] to get the
 * serviceTypeName (which will be the only property). Set the value of the
 * serviceType INPUT element to the serviceTypeName.
 */
const setupServiceType = function (widgetType, configValue, configDetails) {
  console.debug(`setupServiceType: ${configValue} ${configDetails.service[configValue]}`)

  if (configValue === '') {
    jQuery(`#${widgetType}-serviceType`).val('')
    jQuery(`#${widgetType}-serviceAttribute`).val('')
    jQuery(`#${widgetType}-clickValue`).val('')
  } else {
    for (const serviceType in configDetails.service[configValue]) {
      jQuery(`#${widgetType}-serviceType`).val(serviceType)
    }
  }
}

/**
 * Called after a topicDirection is selected from the topicDirection element.
 * Use the topicDirection as the property in configDetails.topic[topicDirection]
 * to get the list of available topics. Add the OPTION elements to the
 * #widgetType-topic SELECT element.
 */
const setupTopic = function (widgetType, configValue, configDetails) {
  console.debug(
    'setupTopic:' +
    ` ${configValue}` +
    ` ${JSON.stringify(configDetails.topic[configValue])}`
  )

  jQuery(`#${widgetType}-topic`)
    .find('option')
    .remove()
  jQuery(`#${widgetType}-topic`).val(null)
  jQuery(`#${widgetType}-topic`).hide().show()

  jQuery(`#${widgetType}-topicType`).val('')
  jQuery(`#${widgetType}-topicAttribute`).val('')

  if (configValue !== '') {
    jQuery(`#${widgetType}-topic`)
      .append('<option value=""></option>')
      .val('')
    for (const topicName in configDetails.topic[configValue]) {
      jQuery(`#${widgetType}-topic`)
        .append(`<option value="${topicName}">${topicName}</option>`)
    }
  }
}

/**
 * Called after a topicName is selected from the topic element. Retrieve the
 * value of the widget's topicDirection SELECT element. Use the
 * topicName as the property in configDetails.topic[topicDirection][topicName]
 * to get the single topicType. Set the value of the topicType INPUT element.
 */
const setupTopicType = function (widgetType, configValue, configDetails) {
  console.debug(`setupTopicType: ${configValue} ${configDetails.topic}`)

  jQuery(`#${widgetType}-topicType`).val('')
  jQuery(`#${widgetType}-topicAttribute`).val('')

  const topicDirection = jQuery(`#${widgetType}-topicDirection`).val()
  if (topicDirection === '') {
    return
  }
  const topicTypeInputElement = jQuery(`#${widgetType}-topicType`)
  topicTypeInputElement.val('')

  if (configValue !== '') {
    /*
     * A for loop is used here, but there can be only one property. The property
     * name is NOT known until run-time.
     */
    for (const topicType in configDetails.topic[topicDirection][configValue]) {
      topicTypeInputElement.val(topicType)
    }
  }
}

/**
 * Handle a change to a 'data' data-section change. Changes to any SELECT element
 * in the data section call this function.
 */
const dataConfigChange = function (event, ui) {
  /*
   * The unique ID for the SELECT element, comprised of the widgetType and the configuration
   * item.
   */
  const selectId = event.target.id
  /*
   * event.target.name is embedded in the selectId, as the second part. event.target.name
   * on its own is NOT unique.
   */
  const widgetType = selectId.split('-')[0]
  const configItem = event.target.name
  const configValue = ui.item.value
  const configDetails = widgetInterface[widgetType]

  switch (configItem) {
    case 'service': {
      setupServiceType(widgetType, configValue, configDetails)
      break
    }

    case 'topicDirection': {
      setupTopic(widgetType, configValue, configDetails)
      break
    }

    case 'topic': {
      setupTopicType(widgetType, configValue, configDetails)
      break
    }

    default: {
      console.warn(`dataConfigChange: ${configItem} is not a recognized configItem`)
    }
  }
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

      setNewWidgetDialogType(widgetType)
    }
  })

  /**
   * Capture changes to the SELECT elements in the data sections of
   * widget configuration.
   */
  let widgetDataElements = ''
  for (const widgetType of WIDGET_TYPES) {
    if (widgetType !== 'gamepad') {
      widgetDataElements += ('.' + widgetType + 'Class, ')
    }
  }
  widgetDataElements = widgetDataElements.slice(0, -2)
  jQuery(widgetDataElements)
    .find('select')
    .each((i, element) => {
      jQuery(`[name=${element.name}]`).selectmenu({
        change: function (event, ui) {
          dataConfigChange(event, ui)
        }
      })
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
        configuringWidget = true
      },
      close: function (event, ui) {
        gamepad.disableGamepad()
        configuringWidget = false
      }
    }).dialog('open')
  })
}

/*
 * The widget_interface object is used similarly to the objects in src/ros_interfaces.js.
 * It defines the allowed service, topic, and attributes allowed for each widget
 * type.
 * Widgets are more constrained than the gamepad. There aren't any widgets which have
 * the option of either a topic or a service.
 *
 * The widgetInterface contains a property for each member of WIDGET_TYPES,
 * exluding 'gamepad'. The value for each property is an object with one of
 * the following structures:
 *
 * 'service': {
 *   serviceName: {                  // service
 *     interfaceName: [              // serviceType
 *       attribute1,                 // serviceAttribute
 *       attribute2,
 *       attributeN
 *     ]
 *   }
 * }
 *
 * 'topic': {
 *   'publish'|'subscribe': {        // topicDirection
 *     topicName: {                  // topic
 *       interfaceName: [            // topicType
 *         attribute1,               // topicAttribute
 *         attribute2,
 *         attributeN
 *       ]
 *     },
 *     topicName: {
 *       interfaceName: [
 *         attribute1,
 *         attribute2,
 *         attributeN
 *       ]
 *     }
 *   }
 * }
 *
 */
const widgetInterface = {
  button: {
    // can only call services
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
    // can only publish to topics and only one at a time
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
    // can only subscribe to topics and only one at a time
    topic: {
      subscribe: {
        telemetry: {
          // attribute values must be numeric
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
    // can only subscribe to topics and only one at a time
    topic: {
      subscribe: {
        telemetry: {
          // attribute values must be boolean
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
    // can only publish to topics and only one at a time.
    // the widget produces two values from -1.0 to 1.0 and
    //  the horizontal value will be assigned to the first attribute
    //  and the vertical to the second.
    topic: {
      publish: {
        servos: {
          'rq_msgs/msg/Servos': [
            'servo0.speed_dps',
            'servo0.command_type:3',
            'servo1.speed_dps',
            'servo1.command_type:3',
            'servo2.speed_dps',
            'servo2.command_type:3',
            'servo3.speed_dps',
            'servo3.command_type:3',
            'servo4.speed_dps',
            'servo4.command_type:3',
            'servo5.speed_dps',
            'servo5.command_type:3',
            'servo6.speed_dps',
            'servo6.command_type:3',
            'servo7.speed_dps',
            'servo7.command_type:3',
            'servo8.speed_dps',
            'servo8.command_type:3',
            'servo9.speed_dps',
            'servo9.command_type:3',
            'servo10.speed_dps',
            'servo10.command_type:3',
            'servo11.speed_dps',
            'servo11.command_type:3',
            'servo12.speed_dps',
            'servo12.command_type:3',
            'servo13.speed_dps',
            'servo13.command_type:3',
            'servo14.speed_dps',
            'servo14.command_type:3',
            'servo15.speed_dps',
            'servo15.command_type:3'
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
