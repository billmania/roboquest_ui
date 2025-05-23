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

RQ_PARAMS.VERSION = '36'

RQ_PARAMS.CONFIG_FORMAT_VERSION = '8'
RQ_PARAMS.CONFIG_FILE = 'persist/configuration.json'
RQ_PARAMS.SERVO_FILE = 'persist/servos_config.json'
RQ_PARAMS.VERSIONS_FILE = 'persist/versions.json'
RQ_PARAMS.STATUS_INTERVAL_MS = 2000
RQ_PARAMS.STATUS_PORT = '8444'
RQ_PARAMS.STATUS_FILE = 'updater.log'
// TODO: Remove this obsolete constant
// RQ_PARAMS.MESSAGE_DURATION_S = 15
RQ_PARAMS.PROBE_PERIOD_MS = 10000

RQ_PARAMS.UPDATE_FORMAT_VERSION = 1
RQ_PARAMS.DISCONNECTED_IMAGE = 'img/background.jpg'

// topic attributes are delimited with this character
RQ_PARAMS.ATTR_DELIMIT = ';'
/*
 * When an attribute is to always be assigned a constant,
 * use this character to separate the attribute name from
 * the constant.
 */
RQ_PARAMS.VALUE_DELIMIT = ':'

/*
 * Colors for highlighting invalid gamepad attribute configurations.
 */
RQ_PARAMS.VALID_COLOR = 'white'
RQ_PARAMS.INVALID_COLOR = 'red'

// TODO: Implement use of this in public/js/index.js
RQ_PARAMS.WIDGET_NAMESPACE = 'rq'

RQ_PARAMS.PING_TIMEOUT_MS = 1500
RQ_PARAMS.PING_INTERVAL_MS = 1500
RQ_PARAMS.SOCKET_TIMEOUT_MS = 1000

/*
 * Period for polling a connected gamepad.
 */
RQ_PARAMS.POLL_PERIOD_MS = 100
