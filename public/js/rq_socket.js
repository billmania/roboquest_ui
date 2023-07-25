/**
 * RQSocket manages the messages passed through the socket.io connection
 * with the backend server. It provides a method to define incoming events
 * and associate a callback function with them. For outgoing events it
 * provides a separate method to accept the name of the event and the
 * associated payload.
 *
 * The RQSocket class depends on having the socket.io module already
 * require-d.
 */

class RQSocket {
  /**
   * Define and establish the socket connection with the backend server.
   *
   * @param connect_cb {Function} - Called when the socket connects.
   * @param disconnect_cb {Function} - Called when the socket disconnects.
   */
  constructor (connect_cb, disconnect_cb) {
    this.inboundEvents = {}
    this.socket = io(
      window.location.hostname +
      ':' +
      window.location.port)
    this.socket.on('connect', connect_cb)
    this.socket.on('disconnect', disconnect_cb)
    console.log('RQSocket instantiated')
  }

  /**
   * Add an incoming event.
   * @param {string} eventName - The name of the event.
   * @param {Function} callback - The function to call when the event
   *                              is received.
   *
   * @return {string} - The name of the event.
   */
  add_event (eventName, callback) {
    this.socket.on(eventName, callback)
    this.inboundEvents[eventName] = callback
  }

  /**
   * List the incoming events defined. The associated callback
   * is not included.
   *
   * @return {Array} - An Array with the sorted events.
   */
  list_incoming_events () {
    return Object.keys(this.inboundEvents).sort()
  }

  /**
   * Send an outgoing event.
   *
   * @param {string} eventName - The name of the event.
   * @param {string} payload - The data payload to send.
   *
   */
  send_event (eventName, payload) {
    this.socket.emit(eventName, payload)
  }

  connect () {
    console.log('Socket connected, ID: ' + this.socket.id)
  };

  disconnect (reason) {
    console.log('Socket disconnected, Reason: ' + reason)
  };
} // RQSocket
