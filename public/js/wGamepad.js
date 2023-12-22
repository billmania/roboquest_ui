'use strict'
/* global jQuery, RQ_PARAMS, configuringWidget */

/**
 * A widget to represent a single gamepad. Only one gamepad
 * is managed.
 * Unlike other widgets, the jQuery widget itself is mostly a
 * placeholder. Its button is used only to enable and disable the
 * gamepad. The UI widget is also how the gamepad is configured.
 * The widget itself doesn't generate any topic or service
 * attribute values to send to the backend.
 * Also unlike other widgets, the gamepad isn't constrained
 * to a single topic or service.
 */

const BUTTON_PREFIX = 'b'
const AXIS_PREFIX = 'a'
const PAD_LENGTH = 2
const ROW_ID_LENGTH = PAD_LENGTH + BUTTON_PREFIX.length

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
 * 'buttons' and 'axes' come from the Gamepad object.
 */
const PREFIX_MAP = {}
PREFIX_MAP[BUTTON_PREFIX] = 'buttons'
PREFIX_MAP[AXIS_PREFIX] = 'axes'

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
   * row must begin with the same ROW_ID_LENGTH characters.
   *
   *    elementName     -> propertyName
   *    -----------       ------------
   * for all elements:
   *
   *    description     -> first ROW_ID_LENGTH name characters to row
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
   * @param {string} elementName - the first ROW_ID_LENGTH characters are
   *                               used to identify the row
   * @param {string} elementValue - the value of this element.
   */
  addElement (elementName, elementValue) {
    const rowId = elementName.slice(0, ROW_ID_LENGTH)
    const element = elementName.slice(ROW_ID_LENGTH)

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
        let parsed
        if (elementValue.indexOf(RQ_PARAMS.ATTR_DELIMIT) > -1) {
          const attributes = elementValue
            .replaceAll(' ', '')
            .split(RQ_PARAMS.ATTR_DELIMIT)
          parsed = attributes
        } else {
          parsed = [parseInt(elementValue)]
        }
        if (this._dataObject.topicDirection) {
          this._dataObject.scale = parsed
        } else {
          console.warn(
            `${elementName} services don't use scaling`
          )
        }
        break
      }

      case 'attributes': {
        let parsed
        if (elementValue.indexOf(RQ_PARAMS.ATTR_DELIMIT) > -1) {
          const attributes = elementValue
            .replaceAll(' ', '')
            .split(RQ_PARAMS.ATTR_DELIMIT)
          parsed = attributes
        } else {
          parsed = [elementValue]
        }
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
      throw new ValidationError(
        error.name +
        ':' +
        error.message +
        ', ' +
        JSON.stringify(this._dataObject)
      )
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
    this._actionMap = {}
    this._pollIntervalId = null
    this._lastPoll = 0

    this._haveEvents = false
    this._haveWebkitEvents = false
    this._setupEvents()
  }

  /**
   * Make a map from the row ID of each configured button and axis
   * to the corresponding configuration object. This is done to
   * save _pollGamepad() from having to check every button and every
   * axis.
   *
   * _actionMap is an object with only those gamepad actions (buttons
   * or axes) which have been configured. _pollGamepad identifies
   * actions by a combination of their type (button or axis) and their
   * numerical index within the type.
   *
   * @param {Array} dataConfigs - a list of data configuration objects
   */
  setupActionMap (dataConfigs) {
    let actionType
    let actionIndex
    for (const prefix in PREFIX_MAP) {
      this._actionMap[PREFIX_MAP[prefix]] = {}
    }
    for (const dataConfig of dataConfigs) {
      /*
       * Retrieve the first ROW_ID_LENGTH characters.
       * From that get the PREFIX part and the numerical
       * part. Reassemble them into a string with the
       * PREFIX and the unpadded number.
       */
      actionType = dataConfig.row.slice(0, BUTTON_PREFIX.length)
      actionIndex = parseInt(
        dataConfig.row.slice(BUTTON_PREFIX.length)).toString()
      this._actionMap[PREFIX_MAP[actionType]][actionIndex] = dataConfig
    }
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
    const paddedIndex = rowIndex.toString().padStart(PAD_LENGTH, '0')
    console.debug(`_highlightConfigRow: ${rowPrefix}, ${paddedIndex}`)

    const configRow = jQuery(`#${rowPrefix}${paddedIndex}span`)
    jQuery('.' + HighLightRowClass).removeClass(HighLightRowClass)
    configRow.addClass(HighLightRowClass)
  }

  /**
   * Check the gamepad object for inputs. More than one button
   * and more than one axis can be activated per poll. This
   * method is used for two purposes. The first is when configuring
   * the gamepad and all action state changes are captured. The
   * second is when not configuring. During that scenario,
   * this._actionMap is used to determine which gamepad actions to
   * examine and pass along to the gamepad widget for further
   * processing. The global variable configuringWidget indicates
   * which purpose.
   */
  _pollGamepad () {
    if (!this._gamepadEnabled ||
        this._gamepadIndex === null) {
      return
    }

    if (!this._gamepad.connected) {
      return
    }

    /*
     * An object for conveying the states of those actions
     * specified in this._actionMap. The property is the action
     * identifier and the property's value is the action's value.
     */
    const actions = []
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
       * TODO: Otherwise no value?
       */
      if (!configuringWidget) {
        if (bIndex in this._actionMap[PREFIX_MAP[BUTTON_PREFIX]]) {
          const value = this._gamepad.buttons[bIndex].value
          actions.push({
            value,
            data: this._actionMap[PREFIX_MAP[BUTTON_PREFIX]][bIndex]
          })
        }
      } else {
        if (this._gamepad.buttons[bIndex].pressed) {
          this._highlightConfigRow(
            BUTTON_PREFIX,
            bIndex
          )
        }
      }
    }

    let aIndex
    for (
      aIndex = 0;
      aIndex < this._gamepad.axes.length;
      aIndex++
    ) {
      if (!configuringWidget) {
        if (aIndex in this._actionMap[PREFIX_MAP[AXIS_PREFIX]]) {
          const value = this._gamepad.axes[aIndex]
          actions.push({
            value,
            data: this._actionMap[PREFIX_MAP[AXIS_PREFIX]][aIndex]
          })
        }
      } else {
        if (this._gamepad.axes[aIndex]) {
          this._highlightConfigRow(
            AXIS_PREFIX,
            aIndex
          )
        }
      }
    }

    if (!configuringWidget) {
      console.debug(
        '_pollGamepad: actions' +
        ` ${JSON.stringify(actions)}`
      )
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
        let index = 0;
        index < section.rows;
        index++
      ) {
        const indexId = index.toString().padStart(PAD_LENGTH, '0')
        row = '<tr>'
        row += `<td><label id="${section.prefix}${indexId}">`
        row += `<span id="${section.prefix}${indexId}span">`
        row += `${section.prefix}${indexId}`
        row += '</span>'
        row += '</label></td>'
        for (const field of ACTION_FIELDS) {
          row += `<td><input type="text" data-section="data" value="" name="${section.prefix}${indexId}${field}"></td>`
        }
        row += '</tr>'
        gamepadInputsTable.append(row)
      }
    }
  }

  /**
   * Handle the gamepad connect event, where the details are
   * in event.gamepad. This method is called each time the gamepad
   * is connected, which can occur in either of two scenarios:
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
 * of it being a single data object, it's an Array of data objects.
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
    gamepad.setupActionMap(this.options.data)
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
