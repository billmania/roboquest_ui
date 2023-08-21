$.widget('custom.JOYSTICK', {
  // https://github.com/bobboteck/JoyStick
  options: {
    socket: null,
    data: {
      format: {
        textColor: 'black',
        prefix: '',
        suffix: ''
      }
    }
  },
  _create: function () {
    const objContent = $('<div id="joystick" style="width:200px; height:200px"></div>')
    this.element.children('.widget-content').html(objContent).ready(() => {
      const objJoystick = new JoyStick('joystick', {}, (objData) => {
        console.log(objData)
      })
    })
  },
  _setupSocketListener: function () {
    if (this.options.socket) {
    } else {
      console.error('Socket is not defined.')
    }
  }
})
