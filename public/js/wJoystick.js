'use strict'
/* global jQuery, RQ_PARAMS, JoyStick */

/**
 * A joystick for providing two values based on the position of the joystick
 * knob. Typically used to drive the robot. The x-axis value is always
 * assigned to the first topicAttribute and the y-axis value is assigned to
 * the second attribute.
 *
 * jQuery.widget() uses the jQuery widget factory to add a plugin in the
 * "rq" namespace.
 *
 * Initial idea from https://github.com/bobboteck/JoyStick
 */
jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.JOYSTICK', {
  options: {
    socket: null,
    data: {
      format: {}
    },

    /*
     * Hold the most recent x and y position so they can be passed
     * to _triggerSocketEvent() by the interval.
     */
    currentAxes: { x: 0, y: 0 }
  },

  /**
   * Called when x and y axis values have changed. Used by the Joystick
   * object as a callback and as a utility function by the key event
   * handler.
   *
   * @param {object} axisData - an object with two properties, x and y.
   */
  valuesHandler: function (axesData) {
    this.options.currentAxes = axesData
    if (typeof this.options.data.topicPeriodS === 'undefined' ||
      this.options.data.topicPeriodS === 0 ||
      (axesData.x === 0 && axesData.y === 0)) {
      this._triggerSocketEvent(null, axesData)
    }
  },

  _create: function () {
    if (!this.options.data.scale) {
      this.options.data.scale = [1, 1]
    }
    const objContent = jQuery('<div id="joystick" style="width:200px; height:200px"></div>')

    this.element.children('.widget-content').html(objContent).ready(
      () => {
        const objJoystick = new JoyStick( // eslint-disable-line no-unused-vars
          'joystick',
          {},
          this.valuesHandler.bind(this)
        )
      }
    )

    /**
     * When topicPeriodS is a positive integer, periodically emit the axes values,
     * in case the previous emission was lost.
     */
    if (this.options.data.topicPeriodS) {
      this._repeater = setInterval(
        () => {
          this._triggerSocketEvent(null, this.options.currentAxes)
        },
        this.options.data.topicPeriodS * 1000
      )
    }
  },

  _triggerSocketEvent: function (event, axisValues) {
    const objPayload = {}
    if (!axisValues) {
      console.warn('axisValues were not defined')
      return
    }
    objPayload[this.options.data.topicAttribute[0]] = axisValues.x * this.options.data.scale[0]
    objPayload[this.options.data.topicAttribute[1]] = axisValues.y * this.options.data.scale[1]
    this.options.socket.emit(this.options.data.topic, JSON.stringify(objPayload))
  }
})
