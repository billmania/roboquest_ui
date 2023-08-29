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
      stop: this._triggerSocketEvent.bind(this)
    })
    this.element.children('.widget-content').html(sliderElement)
  },
  _triggerSocketEvent: function (e, ui) {
    if (this.options.socket) {
      this.options.socket.emit(
        this.options.data.topic,
        `{ "${this.options.data.topicAttribute[0]}": "${ui.value}"` +
        `, "${this.options.data.topicAttribute[1]}": "${this.options.label}" }`
      )
    } else {
      console.error('Socket is not defined.')
    }
  }
})
