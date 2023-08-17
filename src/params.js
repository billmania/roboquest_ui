'use strict'

/**
 * A collection of configuration parameters used
 * by server side of the RoboQuest application.
 */

const path = require('path')

const RQ_PARAMS = {}

RQ_PARAMS.SERVER_STATIC_DIR = path.join(
  __dirname, '../public')
RQ_PARAMS.CONFIG_FILE = path.join(
  __dirname, '../public/config/testing_config.json')
RQ_PARAMS.PERSIST_DIR = path.join(
  __dirname, '../public/persist')
RQ_PARAMS.SERVER_PORT_NUMBER = 3456
RQ_PARAMS.SERVER_HEARTBEAT_PERIOD_S = 10

module.exports = RQ_PARAMS
