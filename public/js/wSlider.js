'use strict'
/* global jQuery, RQ_PARAMS */

jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.SLIDER', {
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

    /*
     * Hold the most recent position of the slider, so valuesHandler
     * will be able to change it by an increment. currentPosition is
     * initialized with options.format.default.
     */
    currentPosition: null
  },

  /**
   * Called by the key event handler and in turn calls the _triggerSocketEvent
   * method. valuesHandler translates from the generic commands generated
   * by key events to specific commands required by _triggerSocketEvent.
   *
   * @param {object} positionData - an object with two properties, name
   *                                and value. name is ignored and value
   *                                is interpreted as an increment, not
   *                                an absolute position.
   */
  valuesHandler: function (positionData) {
    const newPosition = this.options.currentPosition + positionData.value
    if (newPosition < this.options.format.min) {
      this.options.currentPosition = this.options.format.min
    } else if (newPosition > this.options.format.max) {
      this.options.currentPosition = this.options.format.max
    } else {
      this.options.currentPosition = newPosition
    }

    this._triggerSocketEvent(null, { value: this.options.currentPosition })
  },

  _create: function () {
    const sliderElement = jQuery('<div class="widgetSlider">').slider({
      min: this.options.format.min,
      max: this.options.format.max,
      step: this.options.format.step,
      value: this.options.format.default,
      animate: this.options.format.animate,
      orientation: this.options.format.orientation,
      change: this._triggerSocketEvent.bind(this),
      slide: this._triggerSocketEvent.bind(this)
    })
    const sliderValues = jQuery(`<div class="sliderValues"><div class="sliderMin">${this.options.format.min}</div><div class="sliderCurrent">${this.options.format.default}</div><div class="sliderMax">${this.options.format.max}</div></div>`)

    this.element.children('.widget-content').append(sliderValues)
    this.element.children('.widget-content').append(sliderElement)

    this.options.currentPosition = this.options.format.default
  },

  _triggerSocketEvent: function (e, ui) {
    if (this.options.socket) {
      this.element.find('.sliderCurrent').text(ui.value)
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
