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

/*
 * The list of socket events expected from the browser.
 */
const incomingEvents = ['update']

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
    this.#client = new ClientComms(
      this.express_server,
      incomingEvents,
      this.event_cb.bind(this)
    )
  }

  /**
   * The callback function which routes the payloads of
   * incomingEvents to their appropriate event handler.
   *
   * @param {string} event_name - the name of the event, from
   *                              this.incoming_events
   * @param {JSON} payload - the payload for the event
   */
  event_cb (eventName, payload) {
    console.log(`event_cb: event:${eventName} payload:${payload}`)

    if (!incomingEvents.includes(eventName)) {
      console.log(`event_cb: ${eventName} not in incomingEvents`)
      return false
    }

    switch (eventName) {
      case 'update':
        this.update_software(
          '{"timestamp": 0, "version": 1, "action": "UPDATE", "args": "UI"}'
        )
        break

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
