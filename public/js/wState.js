// Define your jQuery UI widget
$.widget('custom.INDICATOR', {
  options: {
    socket: null,
    data: {}
  },
  _create: function () {
    this._setupSocketListener()
  },
  _setupSocketListener: function () {
    if (this.options.socket) {
      this.options.socket.on(this.options.data.topic, (strMsg) => {
        const objMsg = JSON.parse(strMsg)
        let strText = this.options.format.falseText
        let strColor = this.options.format.falseColor
        if (objMsg[this.options.data.topicAttribute]) {
          strText = this.options.format.trueText
          strColor = this.options.format.trueColor
        }
        const objContent = $(`<span style='color:${strColor}'>${strText}</span>`)
        this.element.children('.widget-content').html(objContent)
      })
    } else {
      console.error('The socket object is not usable in the widget. Check that the socket is configured and working.')
    }
  }
})
