'use strict'

/**
 * The web server for serving static files and communicating with the browser
 * client.
 */

const RQ_PARAMS = require('./params.js')
const express = require('express')
const http = require('http')
const ClientComms = require('./client_comms.js')

class WebServer {
  #client

  constructor (clientName) {
    this.clientName = clientName

    this.express_app = express()
    this.express_server = http.createServer(this.express_app)
    this.setup_client_comms()
    this.setup_static()

    this.express_server.listen(RQ_PARAMS.SERVER_PORT_NUMBER)
  }

  /**
   * Define where the static HTML, CSS, and JS files will
   * be located.
   */
  setup_static () {
    const STATIC = express.static(RQ_PARAMS.SERVER_STATIC_DIR)
    this.express_app.use(STATIC)
  }

  /**
   * Setup the channel for communication with the client. There may
   * not immediately be a client connected to the other end.
   */
  setup_client_comms () {
    this.#client = new ClientComms(this.express_server)
  }

  /**
   * Send a payload to the client. This method hides the specific
   * details of the client communication.
   *
   * @param {string} payloadType - How the payload is identified for the client.
   * @param {Array} payload - The bytes in the payload.
   *
   * @returns {boolean} - True if the payload was sent.
   */
  send_to_client (payloadType, payload) {
    if (this.#client.send_event(payloadType, payload)) {
      return true
    }

    return false
  }

  send_heartbeat () {
    this.#client.heartbeat()
  }
}

module.exports = WebServer
