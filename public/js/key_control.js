/**
 * Support using keyboard events as an additional way of interacting
 * with browser UI widgets.
 */

'use strict'
/* global jQuery RQ_PARAMS */

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
    this._keyboardIsEnabled = false

    jQuery(this._keyButtonId).on('click', (eventData) => {
      this._handleKeysButton(eventData)
    })
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
