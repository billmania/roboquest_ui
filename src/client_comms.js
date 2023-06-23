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
    this.io.on('connection', this.setup_event_handlers_cb.bind(this))
  }

  /**
   * Called each time a client connects to the socket. Sets the
   * handlers for events received from the browser-side.
   */
  setup_event_handlers_cb (socket) {
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

  /**
   * Send an eventName with payload, only if there's a client connected.
   *
   * @param {string} eventName - The name of the event.
   * @param {Array) payload - The payload of the event.
   *
   * @returns {boolean} - True if the payload was sent.
   */
  send_event (eventName, payload) {
    if (this.client_connected) {
      this.io.emit(
        eventName,
        payload)

      return true
    }

    return false
  }

  /**
   * Sends heartbeat events to the client.
   */
  heartbeat () {
    if (!this.send_event('hb', Date.now().toString())) {
      console.log('Heartbeat not sent. No client.')
    }
  }
}

module.exports = ClientComms
