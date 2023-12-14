'use strict'
/* global jQuery, RQ_PARAMS */

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
    console.debug(`_pollGamepad: updated at ${this._gamepad.timestamp}`)

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
   * Handle the gamepad connect event, where the details are
   * in event.gamepad.
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
    if (this._pollIntervalId) {
      clearInterval(this._pollIntervalId)
      this._pollIntervalId = null
    }
    delete this._gamepad
    this._gamepad = null
  }

  /**
   * Change the state of the gamepad.
   */
  changeGamepadState () {
    console.debug('changeGamepadState: called')
    if (this._pollIntervalId) {
      clearInterval(this._pollIntervalId)
      this._pollIntervalId = null
    }

    if (this._gamepadEnabled) {
      this._gamepadEnabled = false
      console.debug('changeGamepadState: disabled')
    } else {
      this._gamepadEnabled = true
      this._pollIntervalId = setInterval(
        this._pollGamepad.bind(this),
        RQ_PARAMS.POLL_PERIOD_MS
      )
      console.debug('changeGamepadState: enabled')
    }
  }
}

const _gamepad = new Gamepad()

jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.GAMEPAD', {
  options: {
    format: {
      text: 'Enable pad',
      name: 'Gamepad0'
    },
    data: {},
    socket: null,
    gamepad: _gamepad
  },

  _create: function () {
    const gamepadElement = jQuery('<div class="widgetGamepad">')
      .text(this.options.format.text)
      .button()
      .appendTo(this.element)
    this.element.children('.widget-content').html(gamepadElement)

    gamepadElement.on('click', () => {
      _gamepad.changeGamepadState()
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
