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
      /*
       * N possiblities here:
       * 1. the config file is valid and the correct version
       * 2. the config file is non-empty but also non-parseable
       * 3. the config file is empty
       */
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
   * Based upon:
   * https://nodejs.org/docs/latest-v18.x/api/fs.html#fs_fs_existssync_path
   * https://nodejs.org/docs/latest-v18.x/api/fs.html#fsrmsyncpath-options
   * https://nodejs.org/docs/latest-v18.x/api/fs.html#fsrenamesyncoldpath-newpath
   * https://nodejs.org/docs/latest-v18.x/api/fs.html#fswritefilesyncfile-data-options
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
    try {
      fs.writeFileSync(
        RQ_PARAMS.CONFIG_FILE,
        JSON.stringify(configuration, null, '  '),
        {
          encoding: 'utf8',
          flag: 'w'
        }
      )
    } catch (error) {
      console.error(`save_config: Save failed> ${error}`)
      return false
    }

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
      fs.renameSync(RQ_PARAMS.SERVO_FILE, oldServoFile)
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
      JSON.stringify(configuration, null, '  '),
      {
        encoding: 'utf8',
        flag: 'w'
      }
    )

    return true
  }

  /**
   * Retrieve the configuration from the file in the persistence
   * directory and return it as an object. This method is expected
   * to be called ONLY after the RQ_PARAMS.CONFIG_FILE has been
   * shown (or caused) to exist.
   *
   * Verify the configuration file is:
   * 1. not empty
   * 2. parseable
   *
   * @returns {object} - the configuration
   */
  get_config () {
    const configuration = fs.readFileSync(
      RQ_PARAMS.CONFIG_FILE,
      {
        encoding: 'utf8'
      })

    if (configuration.length === 0) {
      console.error('get_config: Configuration file is empty')
      throw new Error('Configuration file is empty')
    }

    let configurationObj = null
    try {
      configurationObj = JSON.parse(configuration)
      if (!Object.hasOwn(configurationObj, 'version')) {
        throw new Error('No version property')
      }
    } catch (error) {
      console.error(`get_error: Parse failed ${error}`)
      throw new Error('Parse failed')
    }

    return configurationObj
  }
}

module.exports = ConfigFile
