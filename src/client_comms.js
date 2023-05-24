/*
 * Setup a socket.io server-side connection, using an Express
 * instance, for two-way communicate with the browser-side.
 */

'use strict'

const { Server } = require('socket.io')

const PING_INTERVAL = 400
const SOCKET_PING_TIMEOUT_S = 30

class ClientComms {
  constructor (expressServer) {
    this.client_connected = false
    this.socket = null
    this.io = new Server(
      expressServer,
      {
        pingInterval: PING_INTERVAL,
        pingTimeout: SOCKET_PING_TIMEOUT_S * 60
      }
    )
    this.io.on('connection', this.setup_event_handlers.bind(this))
  }

  setup_event_handlers (socket) {
    /*
     * Set the handlers for events received from the browser-side.
     */
    this.socket = socket
    console.log('Client connected on: ' + this.socket.id)
    this.socket.on(
      'disconnect',
      () => {
        this.client_connected = false
        console.log('Client disconnected from: ' + this.socket.id)
        this.socket = null
      })

    this.socket.on(
      'hb',
      payload => {
        console.log(`Client heartbeat payload ${payload}`)
      }
    )

    this.client_connected = true
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
