'use strict'

const express = require('express')
const http = require('http')
const path = require('path')
const ClientComms = require('./client_comms.js')
const PORT_NUMBER = 3456

class ExpressComms {
  #client

  constructor (clientName) {
    this.clientName = clientName

    this.express_app = express()
    this.express_server = http.createServer(this.express_app)
    this.setup_client_comms()
    this.setup_static()

    this.express_server.listen(PORT_NUMBER)
  }

  setup_static () {
    /*
     * Define where the static HTML, CSS, and JS files will
     * be located.
     */
    const STATIC_DIR = path.join(__dirname, '../public')
    const STATIC = express.static(STATIC_DIR)
    this.express_app.use(STATIC)
    console.log('STATIC location set to ' + STATIC_DIR)
  }

  setup_client_comms () {
    /*
     * Setup the channel for communication with the client. There may not
     * be a client connected to the other end.
     */
    this.#client = new ClientComms(this.express_server, PORT_NUMBER)
    console.log('Client communication setup')
  }

  send_heartbeat () {
    this.#client.heartbeat()
  }
}

module.exports = ExpressComms
