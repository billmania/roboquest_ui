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

class Gamepad {
  /**
   *
   */
  constructor () {
    this._gamepad = null
    this._gamepadEnabled = false
    this._pollIntervalId = null
    this._lastPoll = 0

    this._haveEvents = false
    this._haveWebkitEvents = false
    this._setupEvents()
  }

  /**
   * Is there a gamepad connected, regardless of its current
   * state.
   *
   * @returns {boolean} - true if a gamepad is connected
   */
  gamepadConnected () {
    return (this._gamepad !== null)
  }

  /**
   * Check the gamepad object for updates.
   *
   */
  _pollGamepad () {
    if (!this._gamepadEnabled || !this._gamepad) {
      return
    }

    if (this._gamepad.timestamp <= this._lastPoll) {
      return
    }

    if (!configuringWidget) {
      console.debug('_pollGamepad: Routing events to valuesHandler')
    } else {
      console.debug('_pollGamepad: Routing events to configuration dialog')
    }

    let index
    for (
      index = 0;
      index < this._gamepad.buttons.length;
      index++
    ) {
      // TODO: Implement
    }

    for (
      index = 0;
      index < this._gamepad.axes.length;
      index++
    ) {
      // TODO: Implement
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
      'name',
      'destination',
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
        prefix: 'b',
        type: 'Buttons'
      },
      {
        rows: this._gamepad.axes.length,
        prefix: 'a',
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
        row += `<td><label id="${section.prefix}${index}">${section.prefix}${index}</label></td>`
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
    this._gamepad = event.gamepad

    console.debug(
      '_handleConnect:' +
      ` id: ${this._gamepad.id}` +
      ` buttons: ${this._gamepad.buttons.length}` +
      ` axes: ${this._gamepad.axes.length}`
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
    console.debug('changeGamepadState: called')

    if (this._gamepadEnabled) {
      this.disableGamepad()
      console.debug('changeGamepadState: disabled')
    } else {
      this.enableGamepad()
      console.debug('changeGamepadState: enabled')
    }
  }
}

/*
 * This is intentionally global, so the widget configuration logic
 * has the ability to enable and disable the gamepad.
 */
const gamepad = new Gamepad()

jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.GAMEPAD', {
  options: {
    format: {
      text: 'Enable pad',
      name: 'Gamepad0'
    },
    data: {},
    socket: null,
    gamepad
  },

  _create: function () {
    const gamepadElement = jQuery('<div class="widgetGamepad">')
      .text(this.options.format.text)
      .button()
      .appendTo(this.element)
    this.element.children('.widget-content').html(gamepadElement)

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
