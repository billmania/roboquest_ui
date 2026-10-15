'use strict'

/**
 * A collection of configuration parameters used
 * by server side of the RoboQuest application.
 */

import path from 'path'

// TODO: Use only for DEV
//let __dirname = '/home/bill/projects/roboquest/ros2ws/src/roboquest_ui/src'

const RQ_PARAMS = {}
RQ_PARAMS.VERSION = '36'
RQ_PARAMS.CONFIG_FORMAT_VERSION = '8'
RQ_PARAMS.SERVER_STATIC_DIR = path.join(
  __dirname, '../public')
RQ_PARAMS.DEFAULT_CONFIG_FILE = path.join(
  __dirname, '../public/config/configuration.json')
RQ_PARAMS.CONFIG_FILE = path.join(
  __dirname, '../public/persist/configuration.json')
RQ_PARAMS.SERVO_FILE = path.join(
  __dirname, '../public/persist/servos_config.json')
RQ_PARAMS.LOG_FILE = path.join(
  __dirname, '../public/persist/rq_server.log')
RQ_PARAMS.KEY = path.join(
  __dirname, '../certs/server.key')
RQ_PARAMS.CERT = path.join(
  __dirname, '../certs/server.cert')
// TODO: 8443 for DEV, 443 for PROD
RQ_PARAMS.SERVER_PORT_NUMBER = 443

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

export default RQ_PARAMS
