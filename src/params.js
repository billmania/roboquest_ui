'use strict'

/**
 * A collection of configuration parameters used
 * by server side of the RoboQuest application.
 */

const path = require('path')

const RQ_PARAMS = {}

RQ_PARAMS.CONFIG_FORMAT_VERSION = '2'
RQ_PARAMS.COUNTERS_PERIOD_S = 15
RQ_PARAMS.SERVER_STATIC_DIR = path.join(
  __dirname, '../public')
RQ_PARAMS.DEFAULT_CONFIG_FILE = path.join(
  __dirname, '../public/config/new_config.json')
RQ_PARAMS.CONFIG_FILE = path.join(
  __dirname, '../public/persist/testing_config.json')
RQ_PARAMS.SERVER_PORT_NUMBER = 3456
RQ_PARAMS.SERVER_HEARTBEAT_PERIOD_S = 10

module.exports = RQ_PARAMS
