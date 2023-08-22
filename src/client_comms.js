/*
 * Setup a socket.io server-side connection, using an Express
 * instance, for two-way communication with the browser-side.
 */

'use strict'

const { Server } = require('socket.io')

const PING_INTERVAL_MS = 25000
const PING_TIMEOUT_MS = 20000

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
    this.eventCounters = {
      timestamp_ms: 0,
      sent: 0,
      received: 0,
      string: 0,
      object: 0
    }

    this.client_connected = false
    this.socket = null
    this.io = new Server(
      expressServer,
      {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        },
        pingInterval: PING_INTERVAL_MS,
        pingTimeout: PING_TIMEOUT_MS
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
        this.increment_event_counter(eventName, 'received', typeof payload)
        this.eventCb(eventName, JSON.parse(payload))
      }
    )
  }

  /**
   * Increment a specific event counter.
   *
   * @param {string} eventName - the name of the event
   * @param {string} eventDirection - sent or received
   * @param {string} payloadType - string or object
   */
  increment_event_counter (eventName, eventDirection, payloadType) {
    this.eventCounters[eventDirection]++
    this.eventCounters[payloadType]++

    if (eventName in this.eventCounters) {
      if (eventDirection in this.eventCounters[eventName]) {
        this.eventCounters[eventName][eventDirection]++
        return
      }
    } else {
      this.eventCounters[eventName] = {}
    }
    this.eventCounters[eventName][eventDirection] = 1
  }

  /**
   * Called each time a client connects to the socket. Sets the
   * handlers for events received from the browser-side.
   *
   * disconnect events are always handled. this.incoming_events
   * is interpreted as a list of events to also handle, by passing
   * their name and payload to this.eventCb.
   */
  setup_event_handlers_cb (socket) {
    this.socket = socket
    this.eventCounters = {
      timestamp_ms: 0,
      sent: 0,
      received: 0,
      string: 0,
      object: 0
    }
    console.log(`Client connection: ${this.socket.id}, from ${this.socket.handshake.address} at ${this.socket.handshake.time}`)
    this.socket.on(
      'disconnect',
      (reason) => {
        this.client_connected = false
        console.log('Socket disconnected: ' + this.socket.id + ', Reason: ' + reason)
        this.socket = null
      })

    this.incomingEvents.forEach(this.add_event_handler.bind(this))

    this.client_connected = true
  }

  /**
   * Send an eventName with payload, only if there's a client connected.
   *
   * @param {string} eventName - The name of the event.
   * @param {Array} payload - The payload of the event.
   *
   * @returns {boolean} - True if the payload was sent.
   */
  send_event (eventName, payload) {
    if (this.client_connected) {
      this.io.emit(
        eventName,
        payload)

      this.increment_event_counter(eventName, 'sent', typeof payload)

      return true
    }

    return false
  }

  /**
   * Send the event counters to the browser UI.
   */
  send_event_counters () {
    this.eventCounters.timestamp_ms = Date.now()
    const eventCountersStr = JSON.stringify(this.eventCounters)
    console.log(`eventCounters: ${eventCountersStr}`)
    this.send_event('_counters', eventCountersStr)
  }
}

module.exports = ClientComms
