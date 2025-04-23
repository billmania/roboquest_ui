/*
 * Setup a socket.io server-side connection, using an Express
 * instance, for two-way communication with the browser-side.
 */

'use strict'

const { Server } = require('socket.io')
const RQ_PARAMS = require('./params.js')

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
   * @param {Array} incomingEvents - the list of events to catch
   * @param {Function} incomingEventCb - A function which expects two arguments:
   *                                     the name of the event and the event's
   *                                     payload as an object.
   */
  constructor (
    expressServer,
    incomingEvents,
    incomingEventCb) {
    this.incomingEvents = incomingEvents
    this.incomingEventCb = incomingEventCb
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
        pingInterval: RQ_PARAMS.PING_INTERVAL_MS,
        pingTimeout: RQ_PARAMS.PING_TIMEOUT_MS
      }
    )
    this.io.on('connection', this.setup_event_handlers_cb.bind(this))
  }

  /**
   * Add event_name to the collection of incoming events expected.
   * Every incoming event is handled by the same this.incomingEventCb.
   * The data payload accompanying each event is expected to be a
   * parseable JSON string.
   *
   * @param {string} eventName - the name of the event
   */
  add_event_handler (eventName) {
    this.socket.on(
      eventName,
      payload => {
        this.increment_event_counter(eventName, 'received', typeof payload)
        try {
          this.incomingEventCb(eventName, JSON.parse(payload))
        } catch (error) {
          console.log(
            `incomingEventCb: ${eventName}:${payload}, ${error}`)
        }
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
   * disconnect events are always handled. this.incomingEvents
   * is interpreted as a list of events to also handle, by passing
   * their name and payload to this.incomingEventCb.
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
        console.log('Disconnected from robot: ' + reason)
        this.socket = null
      })

    this.socket.on(
      'loadProbe',
      (probeData) => {
        this.io.emit('probeEcho', probeData)
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
    this.send_event('_counters', eventCountersStr)
  }
}

module.exports = ClientComms
