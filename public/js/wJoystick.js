/**
 * A joystick for providing two values based on the position of the joystick
 * knob. Typically used to drive the robot. The x-axis value is always
 * assigned to the first topicAttribute and the y-axis value is assigned to
 * the second attribute.
 *
 * Code copied from https://github.com/bobboteck/JoyStick
 */
$.widget('custom.JOYSTICK', {
  options: {
    socket: null,
    data: {
      format: {}
    },
  },

  currentAxes: { x: 0, y: 0 },

  _create: function () {
    const objWidget = this
    if (!this.options.data.scale) {
      this.options.data.scale = [1, 1]
    }
    const objContent = $('<div id="joystick" style="width:200px; height:200px"></div>')

    this.element.children('.widget-content').html(objContent).ready(() => {
      const objJoystick = new JoyStick('joystick', {}, (objData) => {
        objWidget.currentAxes = objData
        if (typeof this.options.data.topicPeriodS === 'undefined'
            || this.options.data.topicPeriodS === 0
            || (objData.x === 0 && objData.y === 0)) {
          this._triggerSocketEvent(null, objData)
        }
      })
    })

    /**
     * When topicPeriodS is a positive integer, periodically emit the axes values,
     * in case the previous emission was lost.
     */
    if (this.options.data.topicPeriodS) {
      this._repeater = setInterval(() => {  
        this._triggerSocketEvent(null, objWidget.currentAxes )
      }, this.options.data.topicPeriodS * 1000)
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
