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

  setup_static () {
    /*
     * Define where the static HTML, CSS, and JS files will
     * be located.
     */
    const STATIC = express.static(RQ_PARAMS.SERVER_STATIC_DIR)
    this.express_app.use(STATIC)
  }

  setup_client_comms () {
    /*
     * Setup the channel for communication with the client. There may
     * not immediately be a client connected to the other end.
     */
    this.#client = new ClientComms(this.express_server)
  }

  send_heartbeat () {
    this.#client.heartbeat()
  }
}

module.exports = WebServer
