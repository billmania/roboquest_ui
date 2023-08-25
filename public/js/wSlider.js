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
    },
    currentValue: 0
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
    this.currentValue = this.options.format.default
    this.element.children('.widget-content').html(sliderElement)
    this._triggerSocketEvent(null, { value: this.options.format.default })
    if (this.options.data.topicPeriodS) {
      this._repeater = setInterval(() => {  
        this._triggerSocketEvent(null, { value: this.currentValue })
      }, this.options.data.topicPeriodS * 1000)
    }
  },
  _triggerSocketEvent: function (event, ui) {
    if (this.options.socket) {
      objPayload = {}
      if (!this.options.data.topicAttribute[0]) {
        this.options.data.topicAttribute = ['angle']
      }
      if (!this.options.data.topicAttribute[1]) {
        this.options.data.topicAttribute = ['name']
      }
      objPayload[this.options.data.topicAttribute[0]] = ui.value
      // reusing the label for the widget as the "name" of the servo
      objPayload[this.options.data.topicAttribute[1]] = this.options.label
      this.currentValue = ui.value
      console.log(`Slider Emitting ${this.options.data.topic}`, objPayload)
      this.options.socket.emit(this.options.data.topic, JSON.stringify(objPayload))
    } else {
      console.error('The socket object is not usable in the widget. Check that the socket is configured and working.')
    }
  }
})
