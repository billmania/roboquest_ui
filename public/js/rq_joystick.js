/**
 * RQJoystick manages the HTML joystick widget. Inspired from
 * https://www.instructables.com/Making-a-Joystick-With-HTML-pure-JavaScript/
 * after correcting several bugs in the original.
 */

'use strict'

class RQJoystick {
  /**
   * The constructor takes a reference to a callback function. Each time
   * the joystick knob is moved the (x, y) position of the knob is reported
   * to the client by this.dataReturnCb(x, y).
   * x describes the horizontal position of the knob between
   * [-xScaleFactor, xScaleFactor] with the positive values on the right
   * side of the page. y describes the horizontal position in the yScaleFactor range,
   * with positive values on the top of the page. When the joystick is released
   * and centered, it's at (0, 0).
   *
   * @param {integer} joystickRadius - the size of the joystick in pixels
   * @param {Object} canvas - the HTML canvas for the joystick
   * @param {Object} scaleFactors - an object with two floating point properties x
   *                                and y. used to scale the x and y joystick
   *                                positions before calling dataReturnCb.
   * @param {function} dataReturnCb - a function which takes one Array argument.
   *                                  how this class makes the two joystick
   *                                  values available to its client
   */
  constructor (joystickRadius, canvas, scaleFactors, dataReturnCb) {
    this.xOrig = 0
    this.yOrig = 0
    this.joystickCoord = { x: 0, y: 0 }
    this.paint = false
    this.joystickRadius = joystickRadius
    this.scaleFactors = scaleFactors
    this.joystickW = canvas.width
    this.joystickH = canvas.height

    this.joystickCanvas = canvas
    this.joystickContext = this.joystickCanvas.getContext('2d')

    this.dataReturnCb = dataReturnCb

    const eventOptions = {
      capture: true
    }

    this.joystickCanvas.addEventListener('mousedown', this.startDrawing.bind(this), eventOptions)
    this.joystickCanvas.addEventListener('mouseup', this.stopDrawing.bind(this), eventOptions)
    this.joystickCanvas.addEventListener('mouseleave', this.stopDrawing.bind(this), eventOptions)
    this.joystickCanvas.addEventListener('mousemove', this.drawJoystick.bind(this), eventOptions)

    window.addEventListener('resize', this.resize.bind(this), eventOptions)

    this.resize()
  }

  /**
   * Get the current position of the mouse in the canvas.
   *
   * @param {Event} event - the mouse event to provide the position
   */
  getPosition (event) {
    this.joystickCoord.x = event.offsetX
    this.joystickCoord.y = event.offsetY
  }

  /**
   * Calculate (this.xOrig, this.yOrig) and then draw the background
   * of the joystick. The location of the background doesn't change.
   */
  background () {
    // TODO: Only assign these once - they don't change
    this.xOrig = this.joystickW / 2
    this.yOrig = this.joystickH / 2

    this.joystickContext.beginPath()
    this.joystickContext.arc(
      this.xOrig,
      this.yOrig,
      this.joystickRadius + 20,
      0,
      Math.PI * 2,
      true)
    this.joystickContext.fillStyle = '#ECE5E5'
    this.joystickContext.fill()
  }

  /**
   * Draw the knob of the joystick, centered on the current mouse position.
   */
  joystick (mouseX, mouseY) {
    this.joystickContext.beginPath()
    this.joystickContext.arc(
      mouseX,
      mouseY,
      this.joystickRadius,
      0,
      Math.PI * 2,
      true)
    this.joystickContext.fillStyle = '#F08080'
    this.joystickContext.fill()
    this.joystickContext.strokeStyle = '#F6ABAB'
    this.joystickContext.lineWidth = 8
    this.joystickContext.stroke()
  }

  /**
   * Called to define the initial dimensions of the canvas.
   *
   * Don't change the size of the joystick canvas, just log the current size.
   */
  resize () {
    // TODO: Only assign these values once - they don't change
    this.joystickContext.canvas.width = this.joystickW
    this.joystickContext.canvas.height = this.joystickH

    this.background()
    this.joystick(this.joystickW / 2, this.joystickH / 2)
  }

  /**
   * The event listener is bound to the canvas element, so the mousedown
   * event can only happen when the mouse is on the joystick.
   */
  mouseOnJoystick () {
    return true

    /*
    const currentRadius = Math.sqrt(
      Math.pow(this.joystickCoord.x - this.xOrig, 2) +
      Math.pow(this.joystickCoord.y - this.yOrig, 2)
    )
    if (this.joystickRadius >= currentRadius) {
      return true
    }

    return false
     */
  }

  /**
   * Called when the mousedown event occurs on the joystickCanvas. Distinguish
   * between being only on the canvas from being on the knob of the joystick.
   */
  startDrawing (event) {
    this.getPosition(event)
    if (this.mouseOnJoystick()) {
      this.paint = true
      this.joystickContext.clearRect(
        0,
        0,
        this.joystickCanvas.width,
        this.joystickCanvas.height)
      this.background()
      this.joystick(this.joystickCoord.x, this.joystickCoord.y)
      this.drawJoystick(event)
    }
  }

  stopDrawing () {
    this.paint = false

    this.joystickContext.clearRect(
      0,
      0,
      this.joystickCanvas.width,
      this.joystickCanvas.height)
    this.background()
    this.joystick(this.xOrig, this.yOrig)

    if (this.dataReturnCb) {
      this.dataReturnCb([0, 0])
    } else {
      console.log('(0, 0)')
    }
  }

  /**
   * When the mouse moves and the paint flag is set, redraw the joystick
   * background and knob to match the current mouse location. Report the
   * current joystick position to the client.
   */
  drawJoystick (event) {
    if (!this.paint) {
      return
    }

    this.joystickContext.clearRect(
      0,
      0,
      this.joystickCanvas.width,
      this.joystickCanvas.height)
    this.background()

    const angle = Math.atan2(
      (this.joystickCoord.y - this.yOrig),
      (this.joystickCoord.x - this.xOrig)
    )

    /*
     * In case polar coordinates are needed.
     *
    let angleDeg
    if (Math.sign(angle) === -1) {
      angleDeg = Math.round(-angle * 180 / Math.PI)
    } else {
      angleDeg = Math.round(360 - angle * 180 / Math.PI)
    }
     */

    let x
    let y
    if (this.mouseOnJoystick()) {
      this.joystick(this.joystickCoord.x, this.joystickCoord.y)
      x = this.joystickCoord.x
      y = this.joystickCoord.y
    } else {
      x = this.joystickRadius * Math.cos(angle) + this.xOrig
      y = this.joystickRadius * Math.sin(angle) + this.yOrig
      this.joystick(x, y)
    }

    this.getPosition(event)

    /*
     * In case polar coordinates are needed.
     *
    const speed = Math.round(100 *
      Math.sqrt(
        Math.pow(x - this.xOrig, 2) + Math.pow(y - this.yOrig, 2)
      ) / this.joystickRadius
    )
     */

    const xScaled = (x - this.xOrig) / this.joystickRadius * this.scaleFactors.x
    const yScaled = (y - this.yOrig) / this.joystickRadius * this.scaleFactors.y

    if (this.dataReturnCb) {
      this.dataReturnCb([xScaled, -yScaled])
    } else {
      console.log(`(${xScaled}, ${-yScaled})`)
    }
  }
}

// const rqJoystick = new RQJoystick(50, '_joystick_canvas', null)
