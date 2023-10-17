/**
 * Support the run-time configuration of servos.
 */

'use strict'
/* global jQuery RQ_PARAMS */

class ServoConfig { // eslint-disable-line no-unused-vars
  /**
   * Retrieve the servo configuration file.
   */
  constructor () {
    this._servos = null
  }

  /**
   * Fetch the contents of the configuration file and use it to populate
   * a drop-down menu.
   */
  fetch_config () {
    const servoConfig = this

    jQuery.ajax({
      url: RQ_PARAMS.SERVO_FILE,
      dataType: 'json',
      success: function (data) {
        servoConfig._servos = data
        servoConfig._list_servos()
      },
      error: function (objRequest, strStatus, strError) {
        console.error(`Failed to retrieve servo config ${RQ_PARAMS.SERVO_FILE} `, strError)
      }
    })
  }

  /**
   * Edit the configuration of the servo selected in the drop-down menu.
   *
   */
  editServo () {
    console.warn('editServo not implemented yet')
  }

  /**
   * Save the servo config list.
   */
  saveServos () {
    if (!this._servos) {
      console.warn('No servo config to save')
      return
    }

    jQuery.ajax({
      type: 'POST',
      url: '/servos',
      contentType: 'application/json',
      data: JSON.stringify(this._servos),
      success: function (objResponse) {
        console.debug('Save Servos Response', objResponse)
      },
      error: function (objRequest, strStatus, strError) {
        console.error('Error saving servos:', strError)
      }
    })
  }

  /**
   * Populates a drop-down input with the list of servo channel numbers and
   * joint names.
   */
  _list_servos () {
    jQuery('#servoChannel')
      .find('option')
      .remove()

    jQuery.each(this._servos, function (i, servo) {
      jQuery('#servoChannel').append(
        jQuery('<option>', {
          value: servo.channel,
          text: servo.channel + ' ' + servo.joint_name
        }))
    })
  }
}
