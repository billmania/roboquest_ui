$.widget('custom.VALUE', {
  // set all defaults here, they will be overridden by anything defined
  options: {
    socket: null,
    format: {
      textColor: 'black',
      prefix: '',
      suffix: '',
      precision: 6
    },
    data: {}
  },
  _create: function () {
    this._setupSocketListener()
  },
  _setupSocketListener: function () {
    if (this.options.socket) {
      this.options.socket.on(this.options.data.topic, (strMsg) => {
        const objMsg = JSON.parse(strMsg)
        const fltValue = objMsg[this.options.data.topicAttribute].toFixed(this.options.format.precision)
        const objContent = $(`<span style='color:${this.options.format.textColor}'> ${this.options.format.prefix} ${fltValue} ${this.options.format.suffix}</span>`)
        this.element.children('.widget-content').html(objContent)
      })
    } else {
      console.error('The socket object is not usable in the widget. Check that the socket is configured and working.')
    }
  }
})
