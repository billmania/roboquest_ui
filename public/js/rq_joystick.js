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
   * to the client by this.callback(x, y).
   * x describes the horizontal position of the knob between
   * [-joystickRadius, joystickRadius] with the positive values on the right
   * side of the page. y describes the horizontal position in the same range,
   * with positive values on the top of the page.
   *
   * @param {integer} joystickRadius - the size of the joystick in pixels
   * @param {string} canvasId - the element ID of the CANVAS
   * @param {function} callback - a function which takes two arguments. how this class
   *                              makes the two joystick values available to its client
   */
  constructor (joystickRadius, canvasId, callback) {
    this.joystickW = 0
    this.joystickH = 0
    this.xOrig = 0
    this.yOrig = 0
    this.joystickCoord = { x: 0, y: 0 }
    this.paint = false
    this.joystickRadius = joystickRadius

    this.joystickCanvas = document.getElementById(canvasId)
    this.joystickContext = this.joystickCanvas.getContext('2d')

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

  getPosition (event) {
    const mouseX = event.clientX || event.touches[0].clientX
    const mouseY = event.clientY || event.touches[0].clientY

    this.joystickCoord.x = mouseX - this.joystickCanvas.offsetLeft
    this.joystickCoord.y = mouseY - this.joystickCanvas.offsetTop
  }

  /**
   * Update the saved (this.xOrig, this.yOrig) and then draw the background
   * of the joystick.
   */
  background () {
    this.xOrig = this.joystickW / 2
    this.yOrig = this.joystickH / 3

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
   * Draw the knob of the joystick.
   */
  joystick (width, height) {
    this.joystickContext.beginPath()
    this.joystickContext.arc(
      width,
      height,
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
   * Record the current width and height of the joystick, set the canvas
   * dimensions to that width and height, and then draw the resized
   * background and knob of the joystick.
   */
  resize () {
    this.joystickW = window.innerWidth
    this.joystickH = this.joystickRadius * 6.5
    this.joystickContext.canvas.width = this.joystickW
    this.joystickContext.canvas.height = this.joystickH

    this.background()
    this.joystick(this.joystickW / 2, this.joystickH / 3)
  }

  mouseOnJoystick () {
    const currentRadius = Math.sqrt(
      Math.pow(this.joystickCoord.x - this.xOrig, 2) +
      Math.pow(this.joystickCoord.y - this.yOrig, 2)
    )
    if (this.joystickRadius >= currentRadius) {
      return true
    }

    return false
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
    this.joystick(this.joystickW / 2, this.joystickH / 3)
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

    const xRelative = Math.round(x - this.xOrig)
    const yRelative = Math.round(y - this.yOrig)

    if (this.callback) {
      this.callback(xRelative, -yRelative)
    } else {
      console.log(`(${xRelative}, ${-yRelative})`)
    }
  }
}

// const rqJoystick = new RQJoystick(50, '_joystick_canvas', null)
