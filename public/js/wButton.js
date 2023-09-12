'use strict'
/* global jQuery, RQ_PARAMS */

jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.BUTTON', {
  options: {
    format: {},
    data: {},
    socket: null
  },

  /**
   * Called by the key event handler and in turn calls the _triggerSocketEvent
   * method. In the case of this widgetType, valuesHandler merely calls
   * _triggerSocketEvent() because a button produces no more data than its
   * click event.
   */
  valuesHandler: function () {
    this._triggerSocketEvent()
  },

  _create: function () {
    const buttonElement = jQuery('<div class="widgetButton">').text(this.options.format.text).button().appendTo(this.element)
    this.element.children('.widget-content').html(buttonElement)
    buttonElement.on('click', () => {
      this._triggerSocketEvent()
    })
  },

  _triggerSocketEvent: function () {
    if (this.options.socket) {
      this.options.socket.emit(
        this.options.data.service,
        `{"${this.options.data.serviceAttribute}":"${this.options.data.clickValue}"}`
      )
    } else {
      console.error('Socket is not defined.')
    }
  }
})
