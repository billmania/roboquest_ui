'use strict'

/**
 * The web server for serving static files and communicating with the browser
 * client.
 */

const RQ_PARAMS = require('./params.js')
const express = require('express')
const http = require('http')
const fs = require('fs')
const ClientComms = require('./client_comms.js')

class WebServer {
  #client

  constructor (clientName) {
    this.clientName = clientName

    this.incomingEvents = ['update']

    this.express_app = express()
    this.express_server = http.createServer(this.express_app)
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
    this.#client = new ClientComms(
      this.express_server,
      this.incomingEvents,
      this.event_cb.bind(this)
    )
  }

  /**
   * Add eventName to the collection of socket events which are
   * expected to come from the client. It must have been called
   * for every event BEFORE setup_client_comms() is called.
   *
   * @param {string} eventName -
   */
  add_incoming_event (eventName) {
    this.incomingEvents.push(eventName)
  }

  /**
   * The callback function which routes the payloads of
   * incomingEvents to their appropriate event handler.
   *
   * @param {string} eventName - the name of the event, from
   *                              this.incoming_events
   * @param {JSON} payload - the payload for the event
   */
  event_cb (eventName, payload) {
    if (!this.incomingEvents.includes(eventName)) {
      console.log(`event_cb: ${eventName} not in incomingEvents`)
      return false
    }

    switch (eventName) {
      case 'update':
        this.update_software(
          '{"timestamp": 0, "version": 1, "action": "UPDATE", "args": "UI"}'
        )
        break

      case 'cmd_vel':
        console.log(`event_cb: Server received cmd_vel with ${payload}`)
        break;

      default:
        console.log(`event_cb: ${eventName} not handled`)
    }
  }

  /**
   * Send a payload to the client. This method hides the specific
   * details of the client communication.
   *
   * @param {string} eventName - How the payload is identified for the client.
   * @param {Array} payload - The bytes in the payload.
   *
   * @returns {boolean} - True if the payload was sent.
   */
  send_to_client (eventName, payload) {
    if (this.#client.send_event(eventName, payload)) {
      return true
    }

    return false
  }

  /**
   * Start the software update process by writing a command to
   * the FIFO monitored by the updater.py script. The method doesn't
   * return and instead tries to terminate the NodeJS process, because
   * it expects updater.py to terminate the container in which this
   * method is executing.
   *
   * The value of the constant updateFifo must match the constant
   * UPDATE_FIFO in updater.py.
   *
   * @param {JSON string} command - the update command with a timestamp
   *                                and optional arguments
   */
  update_software (command) {
    console.log(`update_software: ${command}`)

    const updateFifo = '/tmp/update_fifo'

    fs.appendFile(
      updateFifo,
      command,
      error => {
        if (error) {
          console.log(`update_software error: ${error}`)
        } else {
          console.log(`update_software wrote ${command}`)
        }
      }
    )

    // process.exit(1)
  }

  send_heartbeat () {
    this.#client.heartbeat()
  }
}

module.exports = WebServer
