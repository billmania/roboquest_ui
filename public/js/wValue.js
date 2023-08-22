$.widget('custom.VALUE', {
  // set all defaults here, they will be overridden by anything defined
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
    this._setupSocketListener()
  },
  _setupSocketListener: function () {
    if (this.options.socket) {
      this.options.socket.on(this.options.data.topic, (strMsg) => {
        const objMsg = JSON.parse(strMsg)
        const fltValue = objMsg[this.options.data.topicAttribute].toFixed(6)
        const objContent = $(`<span style='color:${this.options.format.textColor}'> ${this.options.format.prefix} ${fltValue} ${this.options.format.suffix}</span>`)
        this.element.children('.widget-content').html(objContent)
      })
    } else {
      console.error('Socket is not defined.')
    }
  }
})
