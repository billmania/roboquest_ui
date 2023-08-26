$.widget('custom.JOYSTICK', {
  // https://github.com/bobboteck/JoyStick
  options: {
    socket: null,
    data: {
      format: {}
    },
    currentValue: {x:0, y:0}
  },
  _create: function () {
    const objWidget = this
    //set a default  data.scale
    if (!this.options.data.scale) { this.options.data.scale = [1, 1] }
    const objContent = $('<div id="joystick" style="width:200px; height:200px"></div>')
    this.element.children('.widget-content').html(objContent).ready(() => {
      const objJoystick = new JoyStick('joystick', {}, (objData) => {
        objWidget.currentValue = objData
        this._triggerSocketEvent(null, objData)
      })
    })
    this._triggerSocketEvent(null, { x: 0, y: 0 })
    // setup the repeater if defined and > 0
    if (this.options.data.topicPeriodS) {
      this._repeater = setInterval(() => {  
        this._triggerSocketEvent(null, objWidget.currentValue )
      }, this.options.data.topicPeriodS * 1000)
    }
  },
  _triggerSocketEvent: function (event, ui) {
    objPayload = {}
    if(!ui) { ui={x:0,y:0} }
    objPayload[this.options.data.topicAttribute[0]] = ui.x * this.options.data.scale[0]
    objPayload[this.options.data.topicAttribute[1]] = ui.y * this.options.data.scale[1]
    this.options.socket.emit(this.options.data.topic, JSON.stringify(objPayload))
  }
})
