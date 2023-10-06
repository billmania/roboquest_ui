/**
 * Support using keyboard events as an additional way of interacting
 * with browser UI widgets.
 */

'use strict'
/* global jQuery RQ_PARAMS RQKeysHelp */

/*
 * PROPERTY_SEP separates multiple property-value pairs
 * PAIR_SEP separates the property name from its value
 */
const PROPERTY_SEP = ','
const PAIR_SEP = ':'

class KeyControl { // eslint-disable-line no-unused-vars
  /**
   * Setup to manage key events. Requires an HTML element in the page with
   * the HTML ID set to the CSS string in keyButtonId.
   *
   * If key events will be the primary way to command the robot, set the relevant
   * topicPeriodS attribute to a value about twice the period of the key event repeat
   * frequency.
   *
   * @param {string} keyButtonId - the CSS string identifying the UI KEY button
   */
  constructor (keyButtonId) {
    this._keyButtonId = keyButtonId
    this._keyToWidget = {}
    this._keyableWidgets = []
    this._keysSet = []
    this._configureWidgetObj = null
    this._keyboardIsEnabled = false

    jQuery(this._keyButtonId).on('click', (eventData) => {
      this._handleKeysButton(eventData)
    })
  }

  /**
   * Setup to capture a single keycode after a keycode button in the X table is clicked.
   * This method is called via an "onclick" attribute for each keycode button element.
   *
   * When keycode capture has been enabled by changeAssignedKeycode,
   * capture a single keycode and write it to the keycode button specified
   * by this._clickedKeycodeId. Immediately after, disable the capture of
   * keycodes.
   *
   * @param {string} keycodeId - the HTML ID of the keycoded button
   */
  changeAssignedKeycode (keycodeId) {
    jQuery(window).on('keydown', (eventData) => {
      jQuery(window).off('keydown')
      jQuery(`#${keycodeId}`).html(`${eventData.which}`)
    })
  }

  /**
   * Sort the collection of widgets alphabetically by their labels.
   *
   * @param {object} first - the first widget
   * @param {object} second - the second widget
   */
  _sortKeyableWidgets (first, second) {
    const firstWidgetLabel = jQuery(first).data('widget').label
    const secondWidgetLabel = jQuery(second).data('widget').label

    if (firstWidgetLabel === secondWidgetLabel) {
      return 0
    } else if (firstWidgetLabel < secondWidgetLabel) {
      return -1
    } else {
      return 1
    }
  }

  /**
   * getKeyedWidgets creates an Array of those widgets where the
   * type is in [ Joystick, Button, Slider ]. It doesn't care if
   * keys are assigned.
   * This method must be called before getKeysSet().
   */
  getKeyedWidgets () {
    this._keyableWidgets = []
    const keyControl = this
    jQuery('.BUTTON, .JOYSTICK, .SLIDER').each(function (index) {
      keyControl._keyableWidgets.push(this)
    })
    keyControl._keyableWidgets.sort(this._sortKeyableWidgets)
  }

  /**
   * Given a widget object as an input, extract the keys assigned to the widget
   * and add them to this._keysSet.
   *
   * @param {object} widget - the widget configuration object
   */
  _extractAssignedKeys (widget) {
    const widgetObj = jQuery(widget).data('widget')
    if (Object.hasOwn(widgetObj, 'keys')) {
      this._keysSet = this._keysSet.concat(Object.keys(widgetObj.keys))
    }
  }

  /**
   * Return the set of assigned keys as a string. getKeyedWidgets()
   * must have been called prior to calling this method.
   *
   * TODO: The keycodes alone aren't much use. They should instead be
   * displayed with their widget label and their name.
   *
   * @returns {string} - the set of assigned keys
   */
  getKeysSet () {
    this._keysSet = []
    this._keyableWidgets.forEach(this._extractAssignedKeys.bind(this))

    return String(this._keysSet.sort())
  }

  /**
   * Add an HTML table row to this._widgetsTable for the widget.
   *
   * @param {object} widget - the object defining the widget
   */
  _addWidgetRow (widget) {
    const widgetObj = jQuery(widget).data('widget')
    let hasKeys = 'None'
    if (Object.hasOwn(widgetObj, 'keys')) {
      hasKeys = 'Yes'
    }
    this._widgetsTable += ('<tr>' +
      `<td>${widgetObj.label}</td>` +
      `<td>${widgetObj.type}</td>` +
      `<td><button onclick="keyControl.configureWidget(${widgetObj.id})">Edit</button></td>` +
      `<td>${hasKeys}</td>` +
      '</tr>'
    )
  }

  /**
   * Return the type of the widget being configured.
   *
   * @returns {string} - one of [ joystick, button, slider ]
   */
  getWidgetType () {
    if (this._configureWidgetObj) {
      return this._configureWidgetObj.type
    }

    console.warn('getWidgetType: No widget selected for configuration')
    return ''
  }

  /**
   * Return the help text for the type of widget being configured.
   *
   * @returns {string} - a potentially long string of help text
   */
  getHelpText () {
    if (this._configureWidgetObj) {
      return RQKeysHelp[this._configureWidgetObj.type]
    }

    console.warn('getHelpText: No widget selected for configuration')
    return ''
  }

  /**
   * Record the widget having its key assignments configured and then
   * open the widgetKeysDialog. This is how the widget is made available to
   * this.showKeycodes.
   *
   * There's an inefficiency in this method, since it always must examine
   * every member of this._keyableWidgets, even when it has already located
   * the matching widget.
   *
   * @param {number} widgetId - the unique ID of the widget having its keys configured
   */
  configureWidget (widgetId) {
    this._configureWidgetObj = null
    const keyControl = this
    // TODO: Replace the forEach with a simple iteration loop
    this._keyableWidgets.forEach(function (widget) {
      const widgetObj = jQuery(widget).data('widget')
      if (widgetObj.id === widgetId) {
        keyControl._configureWidgetObj = widgetObj
      }
    })

    if (this._keyboardIsEnabled) {
      this._handleKeysButton()
    }
    jQuery('#widgetKeysDialog').dialog('open')
  }

  /**
   * Return an HTML table with each key-able widget on a separate row. All
   * widgets are included, whether they have assigned keys or not.
   *
   * @returns {string} - HTML to define a table of widgets
   */
  showWidgets () {
    this._widgetsTable = '<table><tr><th>Label</th><th>Type</th><th>Edit</th><th>Keys</th></tr>'
    this._keyableWidgets.forEach(this._addWidgetRow.bind(this))
    this._widgetsTable += '</table>'

    return this._widgetsTable
  }

  /**
   * Return the label for the widget being configured.
   *
   * @returns {string} - the widget's label
   */
  configureWidgetLabel () {
    return this._configureWidgetObj.label
  }

  /**
   * Parse a single property-value pair and return the separated property
   * and value.
   *
   * @param {string} pair - the pair separated by PAIR_SEP
   *
   * @returns {object} - an object with a single property
   */
  _parsePair (pair) {
    pair = pair.split(PAIR_SEP)
    const property = pair[0]
    let value = parseFloat(pair[1])
    if (isNaN(value)) {
      value = pair[1]
    }

    const pairObject = {}
    pairObject[property] = value

    return pairObject
  }

  /**
   * Parse a string from the key assignment downValues or upValues and
   * return a corresponding object suitable for inclusion in
   * configuration.json.
   *
   * @param {string} values - a string looking similar to a JSON object,
   *                          with colon-separated property-value pairs and
   *                          comma-separated properties
   *
   * If a value can be converted to a number, it will be, otherwise it will
   * remain a string.
   */
  _parseValues (values) {
    values = values.replace(/ /g, '')

    if (!values.includes(PROPERTY_SEP)) {
      if (!values.includes(PAIR_SEP)) {
        console.warn(`_parseValues: Failed to parse <${values}>`)
        return ''
      } else {
        // There is a single property-value pair
        return this._parsePair(values)
      }
    } else {
      // There may be more than one property-value pair
      let valuesObject = {}
      for (const pair of values.split(PROPERTY_SEP)) {
        valuesObject = { ...valuesObject, ...this._parsePair(pair) }
      }

      return valuesObject
    }
  }

  /**
   * Read the #widgetKeysTable rows input elements to extract the
   * configuration of keycodes and use them to update this._configureWidgetObj.keys.
   * Each element of the table is expected to be identified with a unique HTML element
   * ID in the format "${columnName}_${rowIndex}" where columnName is from
   * ['keycode', 'name', 'downValues', 'upValues'].
   */
  applyKeycodeConfig () {
    const newKeysConfig = {}
    console.debug(`applyKeycodeConfig: ${this._rowIndex} rows in table`)

    for (let rowIndex = 0; rowIndex < this._rowIndex; rowIndex++) {
      const newKeycode = jQuery('#' + `keycode_${rowIndex}`).text()
      const remove = jQuery('#' + `remove_${rowIndex}`).is(':checked')
      if (newKeycode && newKeycode !== '0' && !remove) {
        newKeysConfig[newKeycode] = {}

        newKeysConfig[newKeycode].name = jQuery('#' + `name_${rowIndex}`).val()
        newKeysConfig[newKeycode].downValues = jQuery('#' + `downValues_${rowIndex}`).val()
        newKeysConfig[newKeycode].upValues = jQuery('#' + `upValues_${rowIndex}`).val()

        if (newKeysConfig[newKeycode].downValues !== '') {
          newKeysConfig[newKeycode].downValues = this._parseValues(
            newKeysConfig[newKeycode].downValues)
        } else {
          delete newKeysConfig[newKeycode].downValues
        }
        if (newKeysConfig[newKeycode].upValues !== '') {
          newKeysConfig[newKeycode].upValues = this._parseValues(
            newKeysConfig[newKeycode].upValues)
        } else {
          delete newKeysConfig[newKeycode].upValues
        }
      }
    }
    console.debug(
      `applyKeycodeConfig: for ${this._configureWidgetObj.label}->` +
      ` ${JSON.stringify(newKeysConfig)}`
    )
    this._configureWidgetObj.keys = newKeysConfig
  }

  /**
   * Add a row to the HTML element ID widgetKeysTable for each assigned keycode.
   * KeyControl.configureWidget() must have been called before calling
   * showKeycodes(), so that this._configureWidgetObj is up to date.
   *
   * The column HTML element IDs are formed from the strings in
   * KEY_COLUMN_NAMES.
   */
  showKeycodes () {
    jQuery('#widgetKeysTable').children('tr').remove()

    jQuery('#widgetKeysTable')
      .append(
        '<tr><th>Keycode</th><th>Key Name</th><th>On Press</th><th>On Release</th><th>Remove</th></tr>'
      )

    let keycodesRow = ''
    this._rowIndex = 0
    if (this._configureWidgetObj.keys) {
      this._widgetId = this._configureWidgetObj.id

      for (const keyCode of Object.keys(this._configureWidgetObj.keys)) {
        const keyConfig = this._configureWidgetObj.keys[keyCode]
        keycodesRow = '<tr>'
        keycodesRow += `<td><button id="keycode_${this._rowIndex}" style="border:2px solid;" onclick="keyControl.changeAssignedKeycode('keycode_${this._rowIndex}')">${keyCode}</button></td>`
        keycodesRow += `<td><input id="name_${this._rowIndex}" type="text" size="10" value="${keyConfig.name}"></td>`
        let downValuesStr = ''
        if (keyConfig.downValues) {
          downValuesStr = JSON.stringify(keyConfig.downValues).replace(/"/g, '').replace(/{/g, '').replace(/}/g, '')
        }
        keycodesRow += `<td><input id="downValues_${this._rowIndex}" type="text" size=20 value="${downValuesStr}"></td>`
        let upValuesStr = ''
        if (keyConfig.upValues) {
          upValuesStr = JSON.stringify(keyConfig.upValues).replace(/"/g, '').replace(/{/g, '').replace(/}/g, '')
        }
        keycodesRow += `<td><input id="upValues_${this._rowIndex}" type="text" size=20 value="${upValuesStr}"></td>`
        keycodesRow += `<td><input id="remove_${this._rowIndex}" type="checkbox"></td>`
        keycodesRow += '</tr>'

        jQuery('#widgetKeysTable').append(keycodesRow)
        this._rowIndex++
      }
    }
  }

  /**
   * Add an empty row to the table of widget keys, so a new key
   * assignment can be made. Can't be called before showKeycodes().
   *
   * The column HTML element IDs are formed from the strings in
   * KEY_COLUMN_NAMES.
   */
  addKeyRow () {
    let keycodesRow = ''

    keycodesRow = '<tr>'
    keycodesRow += `<td><button id="keycode_${this._rowIndex}" onclick="keyControl.changeAssignedKeycode('keycode_${this._rowIndex}')">0</button></td>`
    keycodesRow += `<td><input id="name_${this._rowIndex}" type="text" size="10"></td>`
    keycodesRow += `<td><input id="downValues_${this._rowIndex}" type="text" size=20></td>`
    keycodesRow += `<td><input id="upValues_${this._rowIndex}" type="text" size=20></td>`
    keycodesRow += `<td><input id="remove_${this._rowIndex}" type="checkbox" size=20></td>`
    keycodesRow += '</tr>'

    jQuery('#widgetKeysTable').append(keycodesRow)
    this._rowIndex++
  }

  /**
   * Map a key to a specific widget.
   *
   * @param {number} key - the key number
   * @param {string} widgetId - the unique string identifying the widget as
   *                            its CSS ID.
   * @param {string} widgetType - the non-unique widget type
   * @param {Array} downValues - zero or more numerical values for the keyDown
   * @param {Array} upValues - zero or more numerical values for the keyUp
   */
  _mapKeyToWidget (key, widgetId, widgetType, downValues, upValues) {
    if (!Object.hasOwn(this._keyToWidget, key)) {
      this._keyToWidget[key] = {
        widgetId,
        widgetType,
        downValues,
        upValues
      }
    } else {
      console.error(
        `${widgetId} key ${key} already in use by` +
        ` ${this._keyToWidget[key].widgetId}`
      )
    }
  }

  /**
   * Associate each of a collection of keys with a specific widget.
   *
   * @param {object} objWidget - the object describing the widget configuration
   */
  // TODO: Change the argument to expect the keys sub-object directly so keyConfig can use it
  addKeysForWidget (objWidget) {
    for (const key in objWidget.keys) {
      this._mapKeyToWidget(
        key,
        objWidget.label,
        objWidget.type,
        objWidget.keys[key].downValues,
        objWidget.keys[key].upValues)
    }
  }

  /**
   * Toggle the enabling/disabling of keyboard events. Used as the "click"
   * event on a special, non-widget UI button.
   */
  _handleKeysButton () {
    if (this._keyboardIsEnabled) {
      this._disableKeyEvents()
      jQuery(this._keyButtonId).text('ENABLE KEYS')
      this._keyboardIsEnabled = false
      console.info('Keys are disabled')
    } else {
      this._enableKeyEvents()
      jQuery(this._keyButtonId).text('DISABLE KEYS')
      this._keyboardIsEnabled = true
      console.info('Keys are enabled')
    }
  }

  /**
   * Enable the use of key events.
   */
  _enableKeyEvents () {
    jQuery(window).on('keydown', (eventData) => {
      this._keyHandler(eventData)
    })
    jQuery(window).on('keyup', (eventData) => {
      this._keyHandler(eventData)
    })
  }

  /**
   * Disable the use of key events.
   */
  _disableKeyEvents () {
    jQuery(window).off('keydown')
    jQuery(window).off('keyup')
  }

  /**
   * Based on the key specified in eventData.which, call the associated widget's
   * valueHandler.
   *
   * @param {object} eventData - the event type and the specific key
   */
  _keyHandler (eventData) {
    const whichKey = eventData.which

    if (!Object.hasOwn(this._keyToWidget, whichKey)) {
      console.warn(`${whichKey} not in the list`)
      return
    }

    let values
    if (eventData.type === 'keydown' &&
        Object.hasOwn(this._keyToWidget[whichKey], 'downValues')) {
      values = this._keyToWidget[whichKey].downValues
    } else if (eventData.type === 'keyup' &&
               Object.hasOwn(this._keyToWidget[whichKey], 'upValues')) {
      values = this._keyToWidget[whichKey].upValues
    } else {
      console.error(
        `No values defined for ${this._keyToWidget[whichKey].widgetId}` +
        ` and ${whichKey}`)
    }

    if (values) {
      jQuery('#' + this._keyToWidget[whichKey].widgetId)
        .data(
          RQ_PARAMS.WIDGET_NAMESPACE +
          '-' +
          this._keyToWidget[whichKey].widgetType.toUpperCase())
        .valuesHandler(values)
    }
  }
}
