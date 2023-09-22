'use strict'
/* global jQuery, RQ_PARAMS, JoyStick */

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
    data: {
      format: {}
    },

    /*
     * Hold the most recent x and y position so they can be passed
     * to _triggerSocketEvent() by the interval.
     */
    currentAxes: { x: 0, y: 0 },
    skipAnInterval: false
  },

  /**
   * Accepts axesData (x and y value) and passes them along to _triggerSocketEvent().
   * Used by both the Joystick widget and the KeyControl class.
   *
   * There is a bit of complexity due to the different way the Joystick and KeyControl
   * send their axesData. The Joystick only calls valuesHandler() when the position of
   * the joystick knob moves. KeyControl calls valuesHandler repeatedly as long as the
   * key is depressed, because the OS/browser repeat the keycode for a depressed key.
   * Further complicating matters is the setInterval() based on topicPeriodS from the
   * configuration.
   *
   * If topicPeriodS is a positive number, KeyControl events could cause twice as many
   * calls to _triggerSocketEvent - once for each repeated key event and once for every
   * topicPeriodS interval. The skipAnInterval option is provided to deal with this.
   *
   * @param {object} axisData - an object with two properties, x and y.
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
