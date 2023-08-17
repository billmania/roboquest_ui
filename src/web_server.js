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

  constructor (clientName, configFile) {
    this.clientName = clientName
    this.configFile = configFile
    this.incomingEvents = ['update']
    this.send_to_robot = null

    this.express_app = express()
    this.express_server = http.createServer(this.express_app)
    this.setup_express()

    this.express_server.listen(RQ_PARAMS.SERVER_PORT_NUMBER)
  }

  /**
   * Define where the static HTML, CSS, and JS files will
   * be located. Define the handling of POST requests.
   *
   * A POST request to /config will expect a JSON representation
   * of the complete configuration file in the body of the request.
   * That object will replace the current configuration file and
   * the current file will be renamed with ".old" appended. If the
   * request succeeds, the response will contain the JSON representation
   * of '{ success: true }' and the status code 200.
   * If the request doesn't contain a valid JSON representation of
   * the configuration file, the status code will be 400 and the
   * response will contain
   * '{ success: false, error: "Missing configuration file" }'.
   */
  setup_express () {
    const STATIC = express.static(RQ_PARAMS.SERVER_STATIC_DIR)
    this.express_app.use(STATIC)

    this.express_app.use(express.json())
    this.express_app.post('/config', (request, response) => {
      if (request.body.widgets && request.body.config) {
        this.configFile.save_config(request.body)
        response.status(200).json({ success: true })
        console.log('process_config_post() success')
      } else {
        response.status(400).json({ success: false, error: 'Missing configuration file' })
        console.log('process_config_post() failure')
      }
    })
  }

  /**
   * Setup the mechanism for sending data to the robot.
   *
   * @param {Function} send_function - a function taking two string arguments
   */
  setup_send_to_robot (sendFunction) {
    this.send_to_robot = sendFunction
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

      default:
        this.send_to_robot(eventName, payload)
        break
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
   * UPDATE_FIFO in updater.py. If the FIFO exists, the command is written
   * and then this process exits. Otherwise, this method returns false.
   *
   * @param {JSON string} command - the update command with a timestamp
   *                                and optional arguments
   *
   * @returns {boolean} - false if the FIFO doesn't exist
   */
  update_software (command) {
    console.log(`update_software: ${command}`)

    const updateFifo = '/tmp/update_fifo'

    if (!fs.existsSync(updateFifo)) {
      return false
    }

    fs.appendFileSync(
      updateFifo,
      command
    )

    process.exit(1)
  }

  send_heartbeat () {
    this.#client.heartbeat()
  }
}

module.exports = WebServer
