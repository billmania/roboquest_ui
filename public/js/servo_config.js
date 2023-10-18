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
    this._editingServoChannel = null
    this._servos_changed = false
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
   * Populate the configServoDialog based on the servo selected in
   * chooseServoDialog.
   */
  show_servo_config () {
    const servoChannel = parseInt(jQuery('#servoChannel').find('option:selected').val())
    if (isNaN(servoChannel)) {
      console.warn('show_servo_config: No servo selected')
      this._editingServoChannel = null
      jQuery('#channel').html('No servo selected')
      const servoForKeys = this._servos[0]
      Object.keys(servoForKeys).forEach(function (key) {
        jQuery('#' + key).val('')
      })

      return
    }

    jQuery('#channel').html(`Servo ${servoChannel}`)

    const servoToConfig = this._servos[servoChannel]
    if (servoToConfig.channel !== servoChannel) {
      console.error('show_servo_config: servos_config.json is out of order')
      return
    }
    console.debug(`show_servo_config: channel ${servoChannel} - ${servoToConfig.joint_name}`)
    this._editingServoChannel = servoChannel
    Object.keys(servoToConfig).forEach(function (key) {
      jQuery('#' + key).val(servoToConfig[key])
    })
  }

  /**
   * Update the configuration of the selected servo using the values
   * in configServoDialog.
   */
  apply_servo_config () {
    const servoConfig = this

    if (servoConfig._editingServoChannel === null) {
      console.warn('apply_servo_config: Nothing to apply')
      return
    }

    servoConfig._servos_changed = true
    let value
    let valueAsNumber
    Object.keys(servoConfig._servos[servoConfig._editingServoChannel])
      .forEach(function (key) {
        value = jQuery('#' + key).val()
        valueAsNumber = parseInt(value)
        if (isNaN(valueAsNumber)) {
          servoConfig._servos[servoConfig._editingServoChannel][key] = value
        } else {
          servoConfig._servos[servoConfig._editingServoChannel][key] = valueAsNumber
        }
      })

    console.debug(
      'apply_servo_config:' +
      ` ${JSON.stringify(servoConfig._servos[servoConfig._editingServoChannel])}`
    )
  }

  /**
   * Save the servo config list.
   */
  save_servos () {
    const servoConfig = this

    if (!this._servos) {
      console.warn('No servo config to save')
      return
    }

    if (!this._servos_changed) {
      console.info('Servo config not changed, not saving')
      return
    }

    jQuery.ajax({
      type: 'POST',
      url: '/servos',
      contentType: 'application/json',
      data: JSON.stringify(this._servos),
      success: function (objResponse) {
        console.debug('Save Servos Response', objResponse)
        servoConfig._servos_changed = false
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

    /*
     * Add a blank option to force the selecting of an actual option.
     */
    let nextOption = jQuery('<option>', {
      value: '',
      text: ''
    })
    jQuery('#servoChannel').append(nextOption)

    jQuery.each(this._servos, function (i, servo) {
      nextOption = jQuery('<option>', {
        value: servo.channel,
        text: servo.channel + ' ' + servo.joint_name
      })
      jQuery('#servoChannel').append(nextOption)
    })
  }
}
