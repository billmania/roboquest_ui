$.widget('custom.BUTTON', {
  options: {
    format: {},
    data: {},
    socket: null
  },

  _create: function () {
    const buttonElement = $('<div class="widgetButton">').text(this.options.format.text).button().appendTo(this.element)
    this.element.children('.widget-content').html(buttonElement)
    buttonElement.on('click', () => {
      this._triggerSocketEvent()
    })
  },

  _triggerSocketEvent: function () {
    if (this.options.socket) {
      // console.log(`Emitting ${this.options.data.service} with {${this.options.data.serviceAttribute}:${this.options.data.clickValue}}`)
      this.options.socket.emit(this.options.data.service, `{"${this.options.data.serviceAttribute}":"${this.options.data.clickValue}"}`)
    } else {
      console.error('The socket object is not usable in the widget. Check that the socket is configured and working.')
    }
  }
})
