'use strict'
/* global jQuery, RQ_PARAMS, configuringWidget */

/**
 * A widget to represent a single gamepad. Only one gamepad
 * is managed.
 * Unlike other widgets, this widget itself is mostly a
 * placeholder. Its button is used to enable and disable the
 * gamepad. The UI widget is also how the gamepad is configured.
 * The widget itself doesn't generate any topic attribute
 * values to send to the backend.
 * Also unlike other widgets, the gamepad isn't constrained
 * to a single topic or service.
 */

const BUTTON_PREFIX = 'b'
const AXIS_PREFIX = 'a'
/*
 * What to display on the gamepad widget button when the gamepad
 * is in each state. The button toggles the state.
 */
const ENABLED_TEXT = 'Disable'
const DISABLED_TEXT = 'Enable'

class Gamepad {
  /**
   */
  constructor () {
    this.widgetId = null
    this._gamepadIndex = null
    this._gamepad = null
    this._gamepadEnabled = false
    this._pollIntervalId = null
    this._lastPoll = 0

    this._haveEvents = false
    this._haveWebkitEvents = false
    this._setupEvents()
  }

  /**
   * Set the unique ID for this instance of the Gamepad.
   *
   * @param {string} widgetId - the unique HTML element ID for the widget
   */
  setWidgetId (widgetId) {
    this.widgetId = widgetId
  }

  /**
   * Is there a gamepad connected.
   *
   * @returns {boolean} - true if a gamepad is connected
   */
  gamepadConnected () {
    return (this._gamepadIndex !== null)
  }

  /**
   * Highlight a specific row the the table of axes and buttons
   * configuration. All other highlights will be removed.
   *
   * @param {string} rowPrefix - the prefix part of the HTML element
   *                             ID which identifies the row
   * @param {number} rowIndex - the index part of the HTML element
   *                            ID which identifies the row
   */
  _highlightConfigRow (rowPrefix, rowIndex) {
    const HighLightRowClass = 'highlight-row'
    console.debug(`_highlightConfigRow: ${rowPrefix}, ${rowIndex}`)

    const configRow = jQuery(`#${rowPrefix}${rowIndex}span`)
    jQuery('.' + HighLightRowClass).removeClass(HighLightRowClass)
    configRow.addClass(HighLightRowClass)
  }

  /**
   * Check the gamepad object for changes.
   */
  _pollGamepad () {
    if (!this._gamepadEnabled ||
        this._gamepadIndex === null) {
      return
    }

    if (!this._gamepad.connected) {
      return
    }

    let bIndex
    for (
      bIndex = 0;
      bIndex < this._gamepad.buttons.length;
      bIndex++
    ) {
      /*
       * this._gamepad.buttons is an Array of GamepadButton objects,
       * described in
       * https://developer.mozilla.org/en-US/docs/Web/API/GamepadButton
       * pressed is a boolean set when the button is pressed. If the
       * button can produce a range of values, like the trigger buttons,
       * then value will have a positive, floating point value between
       * 0 and 1.0
       */
      if (this._gamepad.buttons[bIndex].pressed) {
        const value = this._gamepad.buttons[bIndex].value
        if (!configuringWidget) {
          console.debug(`_pollGamepad: Routing button ${bIndex} value ${value} to valuesHandler`)
        } else {
          this._highlightConfigRow(BUTTON_PREFIX, bIndex)
        }
      }
    }

    let aIndex
    for (
      aIndex = 0;
      aIndex < this._gamepad.axes.length;
      aIndex++
    ) {
      const value = this._gamepad.axes[aIndex]
      if (value !== 0) {
        if (!configuringWidget) {
          console.debug(`_pollGamepad: Routing axis ${aIndex} value ${value} to valuesHandler`)
        } else {
          this._highlightConfigRow(AXIS_PREFIX, aIndex)
        }
      }
    }

    this._lastPoll = performance.now()
  }

  /**
   * Setup to detect the gamepad.
   */
  _setupEvents () {
    this._haveEvents = 'GamepadEvent' in window
    this._haveWebkitEvents = 'WebKitGamepadEvent' in window

    if (this._haveEvents) {
      window.addEventListener(
        'gamepadconnected',
        this._handleConnect.bind(this)
      )
      window.addEventListener(
        'gamepaddisconnected',
        this._handleDisconnect.bind(this)
      )
      console.debug('_setupEvents: Plain gamepad support')
    } else if (this._haveWebkitEvents) {
      window.addEventListener(
        'webkitgamepadconnected',
        this._handleConnect.bind(this)
      )
      window.addEventListener(
        'webkitgamepaddisconnected',
        this._handleDisconnect.bind(this)
      )
      console.debug('_setupEvents: Webkit gamepad support')
    } else {
      console.warn('_setupEvents: No gamepad support from this browser')
    }
  }

  /**
   * Enumerate the buttons and axes from the gamepad and build the
   * configuration input form.
   */
  _setupConfigForm () {
    jQuery('#gamepadId').html(this._gamepad.id)
    const attributes = [
      'actionName',
      'destinationType',
      'destinationName',
      'interface',
      'attributes',
      'scaling'
    ]
    let columnHeadings = '<tr><th>ID</th>'
    for (const attribute of attributes) {
      columnHeadings += `<th>${attribute}</th>`
    }
    columnHeadings += '</tr>'

    let index
    let row
    const gamepadInputsTable = jQuery('#gamepadInputsTable')
    gamepadInputsTable.children('tr').remove()
    gamepadInputsTable.append(columnHeadings)

    const sectionDetails = [
      {
        rows: this._gamepad.buttons.length,
        prefix: BUTTON_PREFIX,
        type: 'Buttons'
      },
      {
        rows: this._gamepad.axes.length,
        prefix: AXIS_PREFIX,
        type: 'Axes'
      }
    ]
    for (const section of sectionDetails) {
      gamepadInputsTable.append(`<tr><td><label>${section.type}</label></td></tr>`)
      for (
        index = 0;
        index < section.rows;
        index++
      ) {
        row = '<tr>'
        row += `<td><label id="${section.prefix}${index}">`
        row += `<span id="${section.prefix}${index}span">`
        row += `${section.prefix}${index}`
        row += '</span>'
        row += '</label></td>'
        for (const attribute of attributes) {
          row += `<td><input type="text" data-section="data" value="" name="${section.prefix}${index}${attribute}"></td>`
        }
        row += '</tr>'
        gamepadInputsTable.append(row)
      }
    }
  }

  /**
   * Handle the gamepad connect event, where the details are
   * in event.gamepad. This method is called each time the gamepad
   * is connected, which can occur in either of two scenarioes:
   *
   * 1. no gamepad is configured
   * 2. a gamepad configuration already exists
   *
   * @param {object} event - the complete gamepad connect event
   */
  _handleConnect (event) {
    this._gamepadIndex = event.gamepad.index
    this._gamepad = event.gamepad

    console.debug(
      '_handleConnect:' +
      ` index: ${this._gamepadIndex}` +
      ` ID: ${this._gamepad.id}`
    )
    this._setupConfigForm()
  }

  /**
   * Handle the gamepad disconnect event.
   *
   * @param {object} event - the complete gamepad disconnect event
   */
  _handleDisconnect (event) {
    console.debug(
      '_handleDisconnect:' +
      ` id: ${this._gamepad.id}`
    )
    this.disableGamepad()
    delete this._gamepad
    this._gamepad = null
    this._gamepadIndex = null
  }

  /**
   * Ensure the gamepad is disabled.
   */
  disableGamepad () {
    console.debug('disableGamepad: called')

    if (this._pollIntervalId) {
      clearInterval(this._pollIntervalId)
      this._pollIntervalId = null
    }
    this._gamepadEnabled = false
  }

  /**
   * Try to enable the gamepad. Used for scenarios where
   * the gamepad is needed, without explicit user action, such
   * as gamepad configuration.
   */
  enableGamepad () {
    console.debug('enableGamepad: called')
    if (!this.gamepadConnected()) {
      console.debug('enableGamepad: no gamepad')
      return
    }

    this.disableGamepad()
    this._pollIntervalId = setInterval(
      this._pollGamepad.bind(this),
      RQ_PARAMS.POLL_PERIOD_MS
    )
    this._gamepadEnabled = true
    console.debug('enableGamepad: enabled')
  }

  /**
   * Toggle the state of the gamepad, without knowing its current
   * state in advance.
   */
  changeGamepadState () {
    if (!this.gamepadConnected()) {
      console.debug('changeGamepadState: no gamepad to enable')
      return
    }

    if (this._gamepadEnabled) {
      this.disableGamepad()
      jQuery(`#${this.widgetId} .ui-button`).text(DISABLED_TEXT)
      console.debug('changeGamepadState: disabled')
    } else {
      this.enableGamepad()
      jQuery(`#${this.widgetId} .ui-button`).text(ENABLED_TEXT)
      console.debug('changeGamepadState: enabled')
    }
  }

  /**
   * Queries the gamepad(s) to get their latest state. This doesn't
   * work the way I expect it to work - it doesn't find a connected
   * gamepad.
   */
  _queryGamepads () {
    if (this._gamepadIndex === null) {
      console.warn('_queryGamepads: No gamepad index')
      return
    }

    console.debug(`_queryGamepads: id ${this._gamepad.id}`)
    const gamepads = navigator.getGamepads()
    this._gamepad = gamepads[this._gamepadIndex]
    if (this._gamepad === undefined) {
      console.debug('_queryGamepads: navigator.getGamepads() found no gamepads')
    }
  }
}

/*
 * This is intentionally global, so the widget configuration logic
 * has the ability to enable and disable the gamepad.
 */
const gamepad = new Gamepad()

/*
 * The data option for the gamepad widget is different from the
 * button, label, value, indicator, and joystick widgets. Instead
 * of it being a single object, it's an Array of data objects.
 */
jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.GAMEPAD', {
  options: {
    format: {
      text: DISABLED_TEXT,
      name: 'Gamepad0'
    },
    data: [],
    socket: null,
    gamepad
  },

  _create: function () {
    const gamepadElement = jQuery('<div class="widgetGamepad">')
      .text(DISABLED_TEXT)
      .button()
      .appendTo(this.element)
    this.element.children('.widget-content').html(gamepadElement)

    gamepad.setWidgetId(this.options.label)
    gamepadElement.on('click', () => {
      gamepad.changeGamepadState()
    })
  },

  _triggerSocketEvent: function (dataToEmit) {
    if (this.options.socket) {
      /*
       * Parse dataToEmit, extracting the service(s) and/or topic(s)
       * with their associated attribute values, assemble them into
       * payloads, and emit them.
       */
    }
  }
})
