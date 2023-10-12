/**
 * Enable the configuration of servos.
 */

'use strict'
/* global jQuery RQ_PARAMS */

class ServoConfig { // eslint-disable-line no-unused-vars
  /**
   * Retrieve the servo configuration file.
   */
  constructor () {
    jQuery.ajax({
      url: RQ_PARAMS.SERVO_FILE,
      dataType: 'json',
      success: function (data) {
        this._servos = data
      }
    })
  }

  /**
   * Populates a drop-down input with the list of servo channel numbers and
   * joint names.
   */
  list_servos () {
    jQuery.each(this._servos, function (i, servo) {
      jQuery('#servoChannel').append(
        jQuery('<option>', {
          value: servo.channel,
          text: servo.joint_name
        }))
    })
  }
}
