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

RQ_PARAMS.VERSION = '16'

RQ_PARAMS.CONFIG_FORMAT_VERSION = '5'
RQ_PARAMS.CONFIG_FILE = 'persist/configuration.json'
RQ_PARAMS.MESSAGE_DURATION_S = 15

RQ_PARAMS.UPDATE_FORMAT_VERSION = 1
RQ_PARAMS.DISCONNECTED_IMAGE = 'img/background.jpg'

// multiple topic attributes are delimited with this character
RQ_PARAMS.ATTR_DELIMIT = ';'

// TODO: Implement use of this in public/js/index.js
RQ_PARAMS.WIDGET_NAMESPACE = 'rq'

RQ_PARAMS.PING_TIMEOUT_MS = 1500
RQ_PARAMS.PING_INTERVAL_MS = 1500
RQ_PARAMS.SOCKET_TIMEOUT_MS = 1000
