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
   * directory, copy the image version of the file to the persistence
   * directory.
   */
  _setup_config () {
    if (fs.existsSync(RQ_PARAMS.CONFIG_FILE)) {
      return true
    } else {
      fs.copyFileSync(
        RQ_PARAMS.DEFAULT_CONFIG_FILE,
        RQ_PARAMS.CONFIG_FILE
      )
      console.log(`config file setup ${RQ_PARAMS.CONFIG_FILE}`)
    }
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
   */
  save_config (configuration) {
    const oldConfigFile = RQ_PARAMS.CONFIG_FILE + '.old'
    if (fs.existsSync(oldConfigFile)) {
      fs.rmSync(oldConfigFile)
    }

    fs.renameSync(RQ_PARAMS.CONFIG_FILE, oldConfigFile)

    if (typeof configuration === 'string') {
      configuration = JSON.parse(configuration)
    }
    if (!configuration.version) {
      configuration.version = RQ_PARAMS.CONFIG_FORMAT_VERSION
    }
    fs.writeFileSync(
      RQ_PARAMS.CONFIG_FILE,
      JSON.stringify(configuration, null, '  ')
    )
  }

  /**
   * Retrieve the configuration from the file in the persistence
   * directory and return it as an object.
   *
   * @returns {object} - the configuration
   */
  get_config () {
    const configuration = fs.readFileSync(RQ_PARAMS.CONFIG_FILE)
    console.log(`get_config: from ${RQ_PARAMS.CONFIG_FILE}`)

    return JSON.parse(configuration)
  }
}

module.exports = ConfigFile
