'use strict'

/* global jQuery RQ_PARAMS keyControl */
/* global gamepad GamepadData ROW_ID_LENGTH */
/* global showMsg widgetInterface */

/**
 * Process flow for widget configuration
 *
 * Widget configuration can take two paths: configure a new widget;
 * reconfigure an existing widget.
 *
 * Configure a new widget
 * The process begins by clicking the "add widget" button in the "CONFIGURE"
 * menu. That creates a jQuery dialog using the #newWidget element and opens
 * it. Two functions are called as a result of the "open" event: resetConfigInputs()
 * and setNewWidgetDialogType(). setNewWidgetDialogType() in turn calls
 * populateWidgetConfigurationDialog(ADD). After all these calls have completed,
 * all SELECT and INPUT elements in #configureNewWidgetForm will have been reset
 * and some will have been assigned values based on widgetInterfaces.
 *
 * Reconfigure an existing widget
 * The process begins by clicking the "kebob" at the upper right corner of the
 * widget. That calls the function openConfigureWidgetDialog(), which in turn does
 * two things: call populateWidgetConfigurationDialog(RECONFIG) and then creates a
 * jQuery dialog using the same #newWidget element as the "Configure a new widget"
 * process. After all these calls have completed, all SELECT and INPUT elements in
 * #configureNewWidgetForm will have been reset and some will have been assigned
 * the widget's current configuration values.
 *
 * Both configuration processes
 * At this point, the process flows merge into one. The user modifies the configuration,
 * aided by the dataConfigChange() callback.
 * Once the user has completed the configuration, the Create button is clicked for a
 * new widget or the Done button is clicked for a reconfigured widget.
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
 * Reset all of the format and data section elements, along with
 * the newWidgetLabel element, to ''.
 */
const resetConfigInputs = function () {
  jQuery('#newWidget')
    .find('[data-section]')
    .each((i, element) => {
      const dataSection = jQuery(element).data('section')

      if (dataSection === 'data') {
        if (element.localName === 'select') {
          jQuery(`#${element.id}`).empty()
          jQuery(`#${element.id}`).append('<option value=""></option>')
        } else {
          element.value = ''
        }
      }
    })

  jQuery('#newWidgetType').val('').trigger('change')
  jQuery('#newWidgetLabel').val('')
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
  jQuery('#newWidget .newWidgetClass').hide()
  if (WIDGET_TYPES.includes(widgetType)) {
    jQuery(`#newWidget #${widgetType}`).show()
  } else {
    if (widgetType === '') {
      console.warn(
        'showconfigurationElements:' +
        ' widgetType was blank'
      )
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

  /*
   * This default label is expected to be overwritten when re-configuring
   * an existing widget.
   */
  // TODO: Make the new widgetLabel unique
  jQuery('#newWidgetLabel').val(`new_${widgetType}`)

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
    return
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

  const widgetConfigSelector = `#${widgetType}`
  jQuery(widgetConfigSelector)
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
            if (element.name === 'topic') {
              let topicDirection = 'publish'
              if (Object.hasOwn(widgetOptions, 'subscribe')) {
                topicDirection = 'subscribe'
              }
              dataElement.empty()
              dataElement.append('<option value=""></option>')
              for (const topic in widgetOptions[topicDirection]) {
                dataElement.append(`<option value="${topic}">${topic}</option>`)
              }
            }
          }
        }
      } else if (element.localName === 'input' &&
                 element.name === 'topicDirection') {
        let topicDirection = 'publish'
        if (Object.hasOwn(widgetOptions, 'subscribe')) {
          topicDirection = 'subscribe'
        }
        element.value = topicDirection
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

  /*
   * Retrieve the elements which apply to all widget types and to only
   * widgetType. This logic assumes the SELECT OPTIONs are already correctly
   * populated.
   */
  const widgetClass = '.allWidgetsClass, #' + widgetType
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
            if (reconfig && Object.hasOwn(widgetConfig.data, element.name)) {
              const configValue = widgetConfig.data[element.name]
              console.debug(
                'populateWidgetConfigurationDialog: data elements' +
                ` localName: ${element.localName}` +
                ` name: ${element.name}` +
                ` configValue: ${configValue}`
              )
              if (typeof (configValue) === 'object' &&
                  Array.isArray(configValue)) {
                /*
                 * Only attributes are handled this way and they don't
                 * use a SELECT element.
                 */
                element.value = configValue.join(RQ_PARAMS.ATTR_DELIMIT)
              } else {
                if (element.localName === 'select') {
                  console.debug(
                    'populateWidgetConfigurationDialog:' +
                    ' SELECT->' +
                    ` name: ${element.name}` +
                    ` configValue: ${configValue}`
                  )
                  /*
                   *
                   * Confirm the SELECT named widgetType-element.name has an
                   * OPTION element with the value configValue. If no, set the
                   * SELECT value to '', to force the user to choose an allowed
                   * value.
                   */
                  let foundOption = false
                  jQuery(`#${element.id} option`)
                    .each((i, option) => {
                      console.debug(
                        'populateWidgetConfigurationDialog:' +
                        ` ${element.id} OPTION` +
                        `, value: ${option.value}`
                      )
                      if (option.value === configValue) {
                        foundOption = true
                        console.debug(
                          'populateWidgetConfigurationDialog:' +
                          ` Found OPTION in ${element.id}` +
                          ` with value ${configValue}`
                        )
                        jQuery(`#${element.id}`)
                          .find(`option[value=${configValue}]`)
                          .attr('selected', 'selected')
                        /*
                        jQuery(`#${element.id} select`)
                          .val(configValue)
                         */

                        /*
                         * No need to look at the rest of the OPTIONs.
                         */
                        return false
                      }
                    })
                  if (!foundOption) {
                    jQuery(`#${widgetType}-${element.name} select`)
                      .val('')
                      .trigger('change')
                    console.warn(
                      'populateWidgetConfigurationDialog:' +
                      ` No ${configValue} OPTION found for SELECT ${element.id}`
                    )
                  }
                } else {
                  console.debug(
                    'populateWidgetConfigurationDialog:' +
                    ' INPUT->' +
                    ` name: ${element.name}` +
                    ` configValue: ${configValue}`
                  )
                  element.value = configValue
                }
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
  const widgetType = jQuery('#newWidgetType').val()
  console.debug(
    'extractWidgetConfigurationFromDialog:' +
    ` widgetType: ${widgetType}`
  )

  /*
   * https://learn.jquery.com/using-jquery-core/selecting-elements/
   */
  const configElements = jQuery('#configureNewWidgetForm select, #configureNewWidgetForm input')
  configElements
    .each((index, element) => {
      console.debug(
        'extractWidgetConfigurationFromDialog configElements:' +
        ` ${index}-${element.localName} ${element.name} <${element.value}>`
      )
    })

  let widgetTypesToExclude = ''
  for (const otherWidgetType of WIDGET_TYPES) {
    if (widgetType !== otherWidgetType) {
      widgetTypesToExclude += `[id^="${otherWidgetType}-"], `
    }
  }
  widgetTypesToExclude = `:not(${widgetTypesToExclude.slice(0, -2)})`
  console.debug(
    'extractWidgetConfigurationFromDialog widgetTypesToExclude:' +
    ` <${widgetTypesToExclude}`
  )

  configElements
    .filter(widgetTypesToExclude)
    .each((index, element) => {
      console.debug(
        'extractWidgetConfigurationFromDialog filtered configElements:' +
        ` ${index}-${element.localName} ${element.name} <${element.value}>`
      )
    })

  configElements
    .filter(widgetTypesToExclude)
    .each((i, element) => {
      if (element.value !== undefined) {
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
      } else {
        /*
         * This element doesn't have a value.
         */
        console.warn(
          'extractWidgetConfigurationFromDialog:' +
          ` type: ${element.localName}` +
          ` name: ${element.name}` +
          ' has no value. Skipping.'
        )
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
  const selectedAttribute = jQuery('#widgetAttributeSelect').val()
  if (selectedAttribute === undefined || selectedAttribute === '') {
    return
  }

  const attributesElement = jQuery(`#${activeWidgetAttributesElementId}`)
  let attributes = attributesElement.val()
  if (attributes !== '') {
    attributes += RQ_PARAMS.ATTR_DELIMIT
  }
  attributes += selectedAttribute
  attributesElement.val(attributes)
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
 * Called after a topicName is selected from the topic element. Retrieve the
 * value of the widget's topicDirection SELECT element. Use the
 * topicName as the property in configDetails.topic[topicDirection][topicName]
 * to get the single topicType. Set the value of the topicType INPUT element.
 */
const setupTopicType = function (widgetType, configValue, configDetails) {
  jQuery(`#${widgetType}-topicType`).val('')
  jQuery(`#${widgetType}-topicAttribute`).val('')

  const topicDirection = jQuery(`#${widgetType}-topicDirection`).val()
  if (topicDirection === '') {
    console.warn('setupTopicType: No topicDirection provided')
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
 * Handle a change to a SELECT element in a 'data' data-section.
 */
const dataConfigChange = function (event) {
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
  const configValue = event.target.value
  const configDetails = widgetInterface[widgetType]

  switch (configItem) {
    case 'service': {
      setupServiceType(widgetType, configValue, configDetails)
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
  jQuery('#newWidgetType')
    .change(function (event) {
      const widgetType = event.target.value

      setNewWidgetDialogType(widgetType)
    })

  /**
   * Capture changes to the SELECT elements in the data sections of
   * widget configuration.
   */
  let widgetDataElements = ''
  for (const widgetType of WIDGET_TYPES) {
    if (widgetType !== 'gamepad') {
      widgetDataElements += ('#' + widgetType + ', ')
    }
  }
  widgetDataElements = widgetDataElements.slice(0, -2)
  jQuery(widgetDataElements)
    .find('select')
    .each((i, element) => {
      jQuery(`[name=${element.name}]`)
        .change(function (event) {
          dataConfigChange(event)
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
