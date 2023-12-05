'use strict'
/* global jQuery, RQ_PARAMS, assignValue */
/* global DONT_SCALE, DEFAULT_VALUE */

jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.SLIDER', {
  options: {
    socket: null,
    format: {
      min: 0,
      max: 180,
      default: 90,
      step: 1,
      reversed: 'no',
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
      reversed: this.options.format.reversed,
      value: this.options.format.default,
      animate: this.options.format.animate,
      orientation: this.options.format.orientation,
      change: this._triggerSocketEvent.bind(this),
      slide: this._triggerSocketEvent.bind(this)
    })
    const sliderValues = jQuery(`<div class="sliderValues"><div class="sliderMin">${this.options.format.min}</div><div class="sliderCurrent">${this.options.format.default}</div><div class="sliderMax">${this.options.format.max}</div></div>`)

    this.element.children('.widget-content').append(sliderValues)
    this.element.children('.widget-content').append(sliderElement)

    /*
     * Unbind all keys from the slider, to prevent any conflict between
     * other widgets' configured keys and the slider value.
     */
    jQuery('.ui-slider-handle').off('keydown')
    jQuery('.ui-slider-handle').off('keyup')

    this.options.currentPosition = this.options.format.default
  },

  _triggerSocketEvent: function (e, ui) {
    if (this.options.socket) {
      this.element.find('.sliderCurrent').text(ui.value)
      const objPayload = {}

      let value = ui.value
      if (this.options.format.reversed.toLowerCase() === 'yes') {
        value = Math.abs(value - this.options.format.max) + this.options.format.min
      }

      /*
       * A slider provides one numeric value. If any more attributes
       * are specified, they must include constant values.
       */
      if (this.options.data.topicAttribute.length > 0) {
        assignValue(
          objPayload,
          this.options.data.topicAttribute[0],
          DONT_SCALE,
          value
        )
      }
      if (this.options.data.topicAttribute.length > 1) {
        for (const attr of this.options.data.topicAttribute.slice(1)) {
          assignValue(
            objPayload,
            attr,
            DONT_SCALE,
            DEFAULT_VALUE
          )
        }
      }

      this.options.socket.emit(
        this.options.data.topic,
        JSON.stringify(objPayload)
      )
    } else {
      console.error('Socket is not defined.')
    }
  }
})
