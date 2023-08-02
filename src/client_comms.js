/*
 * Setup a socket.io server-side connection, using an Express
 * instance, for two-way communication with the browser-side.
 */

'use strict'

const { Server } = require('socket.io')

const PING_INTERVAL = 400
const SOCKET_PING_TIMEOUT_S = 30

class ClientComms {
  /**
   * Two-way streaming communication with the browser is implemented
   * using the socket.io module. The browser is allowed to repeatedly
   * open and close a connection to the socket, so the configuration
   * of the socket and, most importantly, the handling of events,
   * must be done each time the browser connects. As a specific example
   * the setup of which socket events are expected from the browser and
   * to be handled by a callback must be setup after each successful
   * browser connection.
   *
   * @param {Object} expressServer -
   * @param {Array} incoming_events - the list of events to catch
   * @param {Function} eventCb - A function which expects two arguments:
   *                              the name of the event and the event's
   *                              payload as an object.
   */
  constructor (
    expressServer,
    incomingEvents,
    eventCb) {
    this.incomingEvents = incomingEvents
    this.eventCb = eventCb

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
   * Add event_name to the collection of events expected
   *
   * @param {string} event_name - the name of the event
   */
  add_event_handler (eventName) {
    this.socket.on(
      eventName,
      payload => {
        this.eventCb(eventName, JSON.parse(payload))
      }
    )
  }

  /**
   * Called each time a client connects to the socket. Sets the
   * handlers for events received from the browser-side.
   *
   * disconnect and hb events are always handled. this.incoming_events
   * is interpreted as a list of events to also handle, by passing
   * their name and payload to this.eventCb.
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
        // TODO: Do something useful with this info
        console.log(`Client heartbeat payload ${payload}`)
      }
    )

    this.incomingEvents.forEach(this.add_event_handler.bind(this))

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
