$.widget('custom.SLIDER', {
  options: {
    socket: null,
    format: {
      min: 0,
      max: 180,
      default: 90,
      step: 1,
      orientation: 'horizontal',
      animate: true
    }
  },
  _create: function () {
    const sliderElement = $('<div class="widgetSlider">').slider({
      min: this.options.format.min,
      max: this.options.format.max,
      step: this.options.format.step,
      value: this.options.format.default,
      animate: this.options.format.animate,
      orientation: this.options.format.orientation,
      change: this._triggerSocketEvent.bind(this),
      slide: this._triggerSocketEvent.bind(this)
    })
    this.element.children('.widget-content').html(sliderElement)
  },
  _triggerSocketEvent: function (e, ui) {
    if (this.options.socket) {
      const objPayload = {}
      objPayload[this.options.data.topicAttribute[0]] = ui.value
      objPayload[this.options.data.topicAttribute[1]] = this.options.label
      this.options.socket.emit(
        this.options.data.topic,
        JSON.stringify(objPayload)
      )
    } else {
      console.error('Socket is not defined.')
    }
  }
})
