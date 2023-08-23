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
        // console.log(this.options.data.topicAttribute, objMsg[this.options.data.topicAttribute])
        if (objMsg[this.options.data.topicAttribute]) {
          strText = this.options.format.trueText
          strColor = this.options.format.trueColor
        }
        const objContent = $(`<span style='color:${strColor}'>${strText}</span>`)
        this.element.children('.widget-content').html(objContent)
      })
    } else {
      console.error('Socket is not defined.')
    }
  }
})
