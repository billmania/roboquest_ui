'use strict'
/* global jQuery, RQ_PARAMS, JoyStick */

const JOYSTICK_DEFAULT_SCALING = [1.0, 1.0]
/*
 * joystickIntervalId is global so any previous setInterval() can be cleared
 * just before reconfiguring the joystick widget.
 */
const joystickIntervalId = {}

/**
 * A joystick for providing two values based on the position of the joystick
 * knob. Typically used to drive the robot. The x-axis value is always
 * assigned to the first topicAttribute and the y-axis value is assigned to
 * the second attribute.
 *
 * Initial idea from https://github.com/bobboteck/JoyStick
 */
jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.JOYSTICK', {
  options: {
    socket: null,
    /*
     * joystick widget type doesn't have any "format" options.
     */
    format: {},
    data: {
      scale: [1, 1],
      topicPeriodS: 5
    },

    /*
     * Hold the most recent x and y position so they can be passed
     * to _triggerSocketEvent() by the interval.
     */
    currentAxes: { x: 0, y: 0 },
    skipAnInterval: false
  },

  /**
   * Accepts axesData (x and y value) and passes them along to
   * _triggerSocketEvent(). Used by both the Joystick widget and
   * the KeyControl class.
   * There is a bit of complexity due to the different way the
   * Joystick and KeyControl send their axesData. The Joystick
   * only calls valuesHandler() when the position of the joystick
   * knob moves. KeyControl calls valuesHandler repeatedly as
   * long as the key is depressed, because the OS/browser repeats
   * the keycode for a depressed key. Further complicating
   * matters is the setInterval() based on topicPeriodS from the
   * configuration.
   *
   * If topicPeriodS is a positive number, KeyControl events
   * could cause twice as many calls to _triggerSocketEvent - once
   * for each repeated key event and once for every topicPeriodS
   * interval. The skipAnInterval option is provided to deal with
   * this.
   *
   * @param {object} axesData - an object describing the joystick
   *                            state. Joystick
   *                            calls with the object
   *                              {"xPosition":109,
   *                               "yPosition":71,
   *                               "x":"18",
   *                               "y":"58",
   *                               "cardinalDirection":"N"}
   *                            while KeyControl calls with the
   *                            object
   *                              {"x":0,"y":0}.
   */
  valuesHandler: function (axesData) {
    if (this.options.currentAxes.x !== axesData.x ||
        this.options.currentAxes.y !== axesData.y) {
      this.options.currentAxes.x = axesData.x
      this.options.currentAxes.y = axesData.y
      this.options.skipAnInterval = true
      this._triggerSocketEvent(null, axesData)
    }
  },

  /**
   * Process the "scale" option. If no scale was provided, set its default
   * value to JOYSTICK_DEFAULT_SCALING. If it was provided as two strings,
   * convert each to a float when required or an int when possible.
   *
   * @param {Array} scaling - the configured scaling
   *
   * @returns {Array} - a two member Array with the scaling values as numbers
   */
  _setupScaling: function (scaling) {
    if (!Array.isArray(scaling) ||
        scaling.length !== 2) {
      scaling = JOYSTICK_DEFAULT_SCALING
    }

    scaling.forEach(function (item, index) {
      if (typeof item !== 'number') {
        scaling[index] = parseFloat(item)
        if (isNaN(scaling[index])) {
          scaling[index] = 1
        }
      }
    })

    return scaling
  },

  /**
   * How to cleanup before deleting the widget.
   */
  _destroy: function () {
    if (Object.hasOwn(joystickIntervalId, this.options.label)) {
      clearInterval(joystickIntervalId[this.options.label])
      delete joystickIntervalId[this.options.label]
    }
  },

  _create: function () {
    const divId = this.options.label + '-div'
    const objContent = jQuery(
      '<div id="' +
      divId +
      '" style="width:200px; height:200px"></div>'
    )

    this.options.data.scale = this._setupScaling(this.options.data.scale)
    this.options.data.topicPeriodS = parseFloat(this.options.data.topicPeriodS)

    const canvasId = this.options.label + '-canvas'
    this.element.children('.widget-content').html(objContent).ready(
      () => {
        const objJoystick = new JoyStick( // eslint-disable-line no-unused-vars
          divId,
          { title: canvasId },
          this.valuesHandler.bind(this)
        )
      }
    )

    /**
     * When topicPeriodS is a positive integer, periodically emit
     * the axes values, in case the previous emission was lost.
     */
    if (this.options.data.topicPeriodS > 0) {
      if (Object.hasOwn(joystickIntervalId, this.options.label)) {
        clearInterval(joystickIntervalId[this.options.label])
        delete joystickIntervalId[this.options.label]
      }

      joystickIntervalId[this.options.label] = setInterval(
        () => {
          if (this.options.skipAnInterval) {
            this.options.skipAnInterval = false
            return
          }
          this._triggerSocketEvent(null, this.options.currentAxes)
        },
        this.options.data.topicPeriodS * 1000
      )
    }
  },

  /**
   * Assign a value to a specific attribute. This function
   * modifies its first argument.
   *
   * @param {object} payload - the payload object
   * @param {number} attrIndex - which attribute
   * @param {number} value - axis value to assign
   */
  _assignValue: function (payload, attrIndex, value) {
    if (this.options.data.topicAttribute[attrIndex] !== '') {
      if (this.options.data.topicAttribute[attrIndex].indexOf(
        RQ_PARAMS.VALUE_DELIMIT) === -1) {
        payload[this.options.data.topicAttribute[attrIndex]] = (
          value * this.options.data.scale[attrIndex]
        )
      } else {
        const nameAndValue = this.options.data.topicAttribute[attrIndex]
          .split(RQ_PARAMS.VALUE_DELIMIT)
        payload[nameAndValue[0]] = nameAndValue[1]
      }
    }
  },

  /**
   * Assemble a payload from the axisValues based on the
   * contents of this.options.data.topicAttribute. There
   * can be one or two attributes. The x value is always
   * assigned to the first attribute, if it exists. y is
   * always assigned to the second, if it exists.
   * An attribute can also have a constant value assinged
   * to it.
   */
  _triggerSocketEvent: function (event, axisValues) {
    const objPayload = {}
    if (!axisValues) {
      console.warn('axisValues were not defined')
      return
    }

    console.debug(
      '_triggerSocketEvent:' +
      ` axisValues: ${JSON.stringify(axisValues)}`
    )
    console.debug(
      '_triggerSocketEvent:' +
      ` topicAttribute: ${JSON.stringify(this.options.data.topicAttribute)}`)

    this._assignValue(objPayload, 0, axisValues.x)
    this._assignValue(objPayload, 1, axisValues.y)

    this.options.socket.emit(
      this.options.data.topic,
      JSON.stringify(objPayload)
    )
  }
})
