'use strict'

/**
 * A collection of configuration parameters used
 * by server side of the RoboQuest application.
 */

const path = require('path')

const RQ_PARAMS = {}
RQ_PARAMS.VERSION = '20'

RQ_PARAMS.CONFIG_FORMAT_VERSION = '6'
RQ_PARAMS.SERVER_STATIC_DIR = path.join(
  __dirname, '../public')
RQ_PARAMS.DEFAULT_CONFIG_FILE = path.join(
  __dirname, '../public/config/configuration.json')
RQ_PARAMS.CONFIG_FILE = path.join(
  __dirname, '../public/persist/configuration.json')
RQ_PARAMS.SERVO_FILE = path.join(
  __dirname, '../public/persist/servos_config.json')
RQ_PARAMS.SERVER_PORT_NUMBER = 80

/*
 * The interval for emitting the _counters statistics.
 */
RQ_PARAMS.COUNTERS_PERIOD_S = 15

/*
 * Used by the socket.io module to detect disconnected client.
 */
RQ_PARAMS.PING_INTERVAL_MS = 2000
RQ_PARAMS.PING_TIMEOUT_MS = 2000

/*
 * How the server communicates with the UPDATE daemon.
 */
RQ_PARAMS.UPDATE_FIFO = '/tmp/update_fifo'

module.exports = RQ_PARAMS
