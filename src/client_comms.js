/*
 * Setup a socket.io server-side connection, using an Express
 * instance, for two-way communicate with the browser-side.
 */

'use strict'

const socket = require('socket.io')

const PING_INTERVAL = 400
const SOCKET_PING_TIMEOUT_S = 30

class ClientComms {
  constructor (expressServer) {
    this.client_connected = false
    this.socket = socket
    this.io = this.socket(
      expressServer,
      {
        pingInterval: PING_INTERVAL,
        pingTimeout: SOCKET_PING_TIMEOUT_S * 60
      }
    )

    this.setup_io()
  }

  setup_io () {
    /*
     * Set the handlers for emits received from the browser-side.
     */
    this.io.on(
      'connection',
      socket => {
        this.client_connected = true
        console.log('Client connected {' + socket)
      }
    )
  }

  heartbeat () {
    /*
     * For sending heartbeats to the client.
     */
    if (this.client_connected) {
      this.io.emit(
        'hb',
        Date.now().toString()
      )
    } else {
      console.log('Heartbeat not sent. No client.')
    }
  }
}

module.exports = ClientComms
