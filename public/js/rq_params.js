'use strict'

/**
 * A collection of configuration parameters used by the client side of
 * the RoboQuest application. It's included with a <SCRIPT> tag.
 *
 * There is duplication in this file of some of the contents of params.js
 * from the server side. Because the browser and NodeJS don't handle
 * JavaScript files exactly the same, the browser and NodeJS application
 * can't share the same file.
 */

const RQ_PARAMS = {}

RQ_PARAMS.CONFIG_FILE = 'config/configuration.json'
RQ_PARAMS.TEST_CONFIG_FILE = 'config/testing_config.json'
RQ_PARAMS.SETTINGS_FILE = 'config/hardcoded_settings.json'
RQ_PARAMS.MESSAGE_DURATION_S = 15
