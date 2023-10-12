/*
 * Manage the UI configuration file.
 */

'use strict'

const fs = require('fs')
const RQ_PARAMS = require('./params.js')

class ConfigFile {
  /**
   * Manage the persistence of the UI configuration file and its
   * version property.
   *
   */
  constructor () {
    this._setup_config()
  }

  /**
   * If the configuration file does not exist in the persistence
   * directory or if it is not the latest version, copy the image
   * version of the file to the persistence directory.
   */
  _setup_config () {
    if (fs.existsSync(RQ_PARAMS.CONFIG_FILE)) {
      const configuration = this.get_config()

      if (configuration.version === RQ_PARAMS.CONFIG_FORMAT_VERSION) {
        return true
      } else {
        console.warn(`replacing config file v${configuration.version}`)
      }
    } else {
      console.warn('config file did not exist')
    }

    fs.copyFileSync(
      RQ_PARAMS.DEFAULT_CONFIG_FILE,
      RQ_PARAMS.CONFIG_FILE
    )
    console.info(`config file v${RQ_PARAMS.CONFIG_FORMAT_VERSION} setup`)
  }

  /**
   * Save the updated configuration in the persistence directory.
   * Any existing previous configuration file is removed. The existing
   * configuration file is moved to the .old file. Lastly, the configuration
   * object is stringified and written.
   *
   * This is a synchronous call, so it's expensive.
   *
   * @param {string|object} configuration - the configuration
   *
   * @returns {boolean} - true on success, false for anything else
   */
  save_config (configuration) {
    const oldConfigFile = RQ_PARAMS.CONFIG_FILE + '.old'
    try {
      if (fs.existsSync(oldConfigFile)) {
        fs.rmSync(oldConfigFile)
      }
      fs.renameSync(RQ_PARAMS.CONFIG_FILE, oldConfigFile)
    } catch (error) {
      console.warn('save_config: Error saving old config file')
      return false
    }

    if (typeof configuration === 'string') {
      try {
        configuration = JSON.parse(configuration)
      } catch (error) {
        console.error('save_config: Exception parsing')
        return false
      }
    }
    if (!configuration.version) {
      configuration.version = RQ_PARAMS.CONFIG_FORMAT_VERSION
    }
    fs.writeFileSync(
      RQ_PARAMS.CONFIG_FILE,
      JSON.stringify(configuration, null, '  ')
    )

    return true
  }

  /**
   * Save the updated servo configuration file in the persistence directory.
   * Any existing previous configuration file is removed. The existing
   * configuration file is moved to the .old file. Lastly, the configuration
   * object is stringified and written.
   *
   * This is a synchronous call, so it's expensive.
   *
   * @param {string|object} configuration - the servo configuration
   *
   * @returns {boolean} - true on success, false for anything else
   */
  save_servos (configuration) {
    const oldServoFile = RQ_PARAMS.SERVO_FILE + '.old'
    try {
      if (fs.existsSync(oldServoFile)) {
        fs.rmSync(oldServoFile)
      }
      fs.renameSync(RQ_PARAMS.SERVO_FILE, oldConfigFile)
    } catch (error) {
      console.warn('save_servos: Error saving old servo config file')
      return false
    }

    if (typeof configuration === 'string') {
      try {
        configuration = JSON.parse(configuration)
      } catch (error) {
        console.error('save_servos: Exception parsing')
        return false
      }
    }
    fs.writeFileSync(
      RQ_PARAMS.SERVO_FILE,
      JSON.stringify(configuration, null, '  ')
    )

    return true
  }

  /**
   * Retrieve the configuration from the file in the persistence
   * directory and return it as an object.
   *
   * @returns {object} - the configuration
   */
  get_config () {
    const configuration = fs.readFileSync(RQ_PARAMS.CONFIG_FILE)

    return JSON.parse(configuration)
  }
}

module.exports = ConfigFile
