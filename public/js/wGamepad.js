'use strict'
/* global jQuery, RQ_PARAMS */

/**
 * A widget to represent a gamepad. Unlike other widgets,
 * this widget itself is mostly a placeholder. Its button
 * is used to enable and disable the gamepad. It's also how
 * the gamepad is configured. The widget itself doesn't
 * generate any topic attribute values to send to the
 * backend.
 * Also unlike other widgets, the gamepad widget arranges
 * for gamepad events and values to be assigned to more
 * than one topic or service.
 */

jQuery.widget(RQ_PARAMS.WIDGET_NAMESPACE + '.GAMEPAD', {
  options: {
    format: {
      text: 'Enable pad'
    },
    data: {},
    socket: null,
    gamepadEnabled: false
  },

  _create: function () {
    const gamepadElement = jQuery('<div class="widgetGamepad">')
      .text(this.options.format.text)
      .button()
      .appendTo(this.element)
    this.element.children('.widget-content').html(gamepadElement)
    gamepadElement.on('click', () => {
      /*
       * Depending on the current state, enable or disable the
       * gamepad.
       */
      console.debug('gamepad button clicked')
    })
  },

  _triggerSocketEvent: function (dataToEmit) {
    if (this.options.socket) {
      /*
       * Parse dataToEmit, extracting the service(s) and/or topic(s)
       * with their associated attribute values, assemble them into
       * payloads, and emit them.
       */
    }
  }
})
