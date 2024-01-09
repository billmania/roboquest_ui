'use strict'

/* global jQuery */

let msgDialogOpen = false

/**
 * Show a message in the msgDialog. If the dialog is already open, append the
 * message to what's already shown. If not, open the dialog and replace any
 * existing message.
 *
 * Relies on the HTML element IDs: msgDialog and msgP.
 *
 * @param {string} msg - the message to set or append
 */
const showMsg = function (msg) { // eslint-disable-line no-unused-vars
  if (!msgDialogOpen) {
    jQuery('#msgP').text(msg)
    jQuery('#msgDialog').dialog('open')
  } else {
    const oldMsg = jQuery('#msgP').text()
    const newMsg = oldMsg + '. ' + msg
    jQuery('#msgP').text(newMsg)
  }
}

/**
 * Record the msgDialog as open.
 */
const setMsgDialogOpen = function () { // eslint-disable-line no-unused-vars
  msgDialogOpen = true
}

/**
 * Record the msgDialog as closed.
 */
const setMsgDialogClosed = function () { // eslint-disable-line no-unused-vars
  msgDialogOpen = false
}
