/**
 * A joystick for providing two values based on the position of the joystick
 * knob. Typically used to drive the robot. The x-axis value is always
 * assigned to the first topicAttribute and the y-axis value is assigned to
 * the second attribute.
 *
 * Code copied from https://github.com/bobboteck/JoyStick
 */
$.widget('custom.JOYSTICK', {
  /*
   * The "options" property is preserved after the widget is created.
   */
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

    /**
     * Called when x and y axis values have changed. Used by the Joystick
     * object as a callback and as a utility function by the key event
     * handler.
     *
     * @param {object) axisData - an object with two properties, x and y.
     */
    valuesHandler: function (axesData) {
      console.debug(`valuesHandler: ${JSON.stringify(axesData)}`)

      this.options.currentAxes = axesData
      if (typeof this.options.data.topicPeriodS === 'undefined'
          || this.options.data.topicPeriodS === 0
          || (axesData.x === 0 && axesData.y === 0)) {
        this._triggerSocketEvent(null, axesData)
      }
    }
  },

  _create: function () {
    const objWidget = this
    if (!this.options.data.scale) {
      this.options.data.scale = [1, 1]
    }
    const objContent = $('<div id="joystick" style="width:200px; height:200px"></div>')

    this.element.children('.widget-content').html(objContent).ready(
      () => {
        const objJoystick = new JoyStick(
          'joystick',
          {},
          this.options.valuesHandler.bind(this)
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
          this._triggerSocketEvent(null, objWidget.options.currentAxes )
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
