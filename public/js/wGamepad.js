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
 * The gamepad widget configuration dialog data section has a
 * form containing a table which includes rows with the following
 * fields.
 * These names are hard-coded into the GamepadData class.
 */
const ACTION_FIELDS = [
  'description', // meaningful to the user
  'destinationType', // topic or service
  'destinationName', // name of topic or service
  'interface', // interface type
  'attributes', // semi-colon delimited list with colon-delimited constants
  'scaling' // signed, floating point
]
/*
 * What to display on the gamepad widget button when the gamepad
 * is in each state. The button toggles the state.
 */
const ENABLED_TEXT = 'Disable'
const DISABLED_TEXT = 'Enable'

class WrongRowId extends Error {
  constructor (message) {
    super(message)
    this.name = 'WrongRowId'
  }
}

class ValidationError extends Error {
  constructor (message) {
    super(message)
    this.name = 'ValidationError'
  }
}

class WrongDestinationType extends Error {
  constructor (message) {
    super(message)
    this.name = 'WrongDestinationType'
  }
}

class UnknownElement extends Error {
  constructor (message) {
    super(message)
    this.name = 'UnknownElement'
  }
}

/**
 * Extract the data configuration from the data-section input
 * elements and assemble them into a data object suitable for
 * the configuration file 'data' list.
 */
class GamepadData { // eslint-disable-line no-unused-vars
  constructor () {
    this._dataObject = {}
    this._dataObject.row = null
  }

  /**
   * Add an element to the data object. If elementValue can be
   * cast to a number, it will be. The mapping from elementNames
   * to properties is as follows. All element names in the same
   * row must begin with the same two characters.
   *
   *    elementName     -> propertyName
   *    -----------       ------------
   * for all elements:
   *
   *    description     -> first two name characters to row
   *    description     -> value to name
   *
   * when destinationType is 'service'
   *
   *    destinationName -> value to service
   *    interface       -> value to serviceType
   *    attributes      -> value to serviceAttribute
   *
   * when destinationType is 'topic'
   *                    -> 'publish' to topicDirection
   *    destinationName -> value to topic
   *    interface       -> value to topicType
   *    attributes      -> value to topicAttribute
   *    scaling         -> value cast to number then to topicScale
   *
   * @param {string} elementName - the first two characters are used
   *                               to identify the row
   * @param {string} elementValue - the value of this element.
   */
  addElement (elementName, elementValue) {
    const rowId = elementName.slice(0, 2)
    const element = elementName.slice(2)

    if (this._dataObject.row === null) {
      this._dataObject.row = rowId
      this._dataObject.name = null
    } else if (rowId !== this._dataObject.row) {
      throw WrongRowId(
        `Element ${this._dataObject.row} got a value for ${rowId}`
      )
    }

    switch (element) {
      case 'scaling': {
        // TODO: Cast and parse into Array
        const parsed = [1]
        if (this._dataObject.topicDirection) {
          this._dataObject.scale = parsed
        } else {
          throw WrongDestinationType(
            `${elementName} only relevant to a topic`
          )
        }
        break
      }

      case 'attributes': {
        // TODO: Parse into Array
        const parsed = ['test_attribute']
        if (this._dataObject.topicDirection) {
          this._dataObject.topicAttribute = parsed
        } else {
          this._dataObject.serviceAttribute = parsed
        }
        break
      }

      case 'interface': {
        if (this._dataObject.topicDirection) {
          this._dataObject.topicType = elementValue
        } else {
          this._dataObject.serviceType = elementValue
        }
        break
      }

      case 'destinationType': {
        switch (elementValue) {
          case 'topic': {
            this._dataObject.topicDirection = 'publish'
            break
          }

          case 'service': {
            /*
             * Nothing special to do, other than verify the value
             * of destinationType.
             */
            break
          }

          default: {
            throw WrongDestinationType(
              `${elementName} must be 'topic' or 'service'`
            )
          }
        }
        break
      }

      case 'destinationName': {
        if (this._dataObject.topicDirection) {
          this._dataObject.topic = elementValue
        } else {
          this._dataObject.service = elementValue
        }
        break
      }

      case 'description': {
        this._dataObject.name = elementValue
        break
      }

      default: {
        throw UnknownElement(`${elementName} not recognized`)
      }
    }
  }

  /**
   * Return the rowId.
   *
   * @returns {string}
   */
  getRow () {
    return this._dataObject.row
  }

  /**
   * Return the configuration data as an object suitable for
   * configuration.json. Perform some validation first.
   */
  getDataObject () {
    try {
      if (this._dataObject.row.length > 0) {
        if (this._dataObject.name.length > 0) {
          if (this._dataObject.topic) {
            if (this._dataObject.topic.length > 0) {
              if (this._dataObject.topicDirection === 'publish') {
                if (Array.isArray(this._dataObject.topicAttribute) &&
                    this._dataObject.topicAttribute.length > 0) {
                  if (Array.isArray(this._dataObject.scale) &&
                      this._dataObject.scale.length > 0) {
                    if (this._dataObject.topicType.length > 0) {
                      return this._dataObject
                    }
                  }
                }
              }
            }
          } else if (this._dataObject.service) {
            if (this._dataObject.service.length > 0) {
              if (Array.isArray(this._dataObject.serviceAttribute) &&
                  this._dataObject.serviceAttribute.length > 0) {
                if (this._dataObject.serviceType.length > 0) {
                  return this._dataObject
                }
              }
            }
          }
        }
      }
    } catch (error) {
      throw new ValidationError(error.name + ' ' + error.message)
    }

    throw new ValidationError(`failed ${JSON.stringify(this._dataObject)}`)
  }
}

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
   * configuration input form. The gamepad widget can publish to zero or
   * more topics and call zero or more services. gamepad actions are
   * button presses and axis moves. A single topic or service can be
   * assigned to multiple actions.
   */
  _setupConfigForm () {
    jQuery('#gamepadId').html(this._gamepad.id)
    let columnHeadings = '<tr><th>actionId</th>'
    for (const field of ACTION_FIELDS) {
      columnHeadings += `<th>${field}</th>`
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
        for (const field of ACTION_FIELDS) {
          row += `<td><input type="text" data-section="data" value="" name="${section.prefix}${index}${field}"></td>`
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
