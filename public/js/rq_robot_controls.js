'use strict'

/**
 * Utility functions for managing the motor control joystick.
 * initJoystick
 * drawJoystick
 * getJoystick
 *
 */

/**
 * Who knows?
 *
 * @param {} canvas -
 * @param {} e -
 * @param {} i -
 *
 * @returns {} -
 */
function getTouch (canvas, e, i) {
  console.log('getTouch called')

  if (e.touches.length >= 1) {
    const rect = canvas.getBoundingClientRect()
    const f = e.touches[i || 0]
    return { x: f.clientX - rect.left - canvas.width / 2, y: f.clientY - rect.top - canvas.height / 2, pressed: true }
  } else {
    return { x: 0, y: 0 }
  }
}

/**
 * Return the current x and y position of the joystick.
 *
 * @param {} canvas -
 * @param {} e -
 *
 * @returns {Object}
 */
function getJoystick (canvas, e) {
  console.log('getJoystick called')

  if (e.buttons === 1) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left - canvas.width / 2,
      y: e.clientY - rect.top - canvas.height / 2,
      pressed: true
    }
  } else {
    return {
      x: 0,
      y: 0,
      pressed: false
    }
  }
}

/**
 * Who knows?
 *
 * @param {} canvas -
 * @param {} e -
 *
 * @returns {} -
 */
function touchMove (canvas, e) {
  console.log('touchMove called')

  for (let i = 0; i < e.touches.length; i++) {
    if (e.touches[i].target.parentElement.id === canvas.parentElement.id) {
      e.preventDefault()
      const mouse = getTouch(canvas, e, i)
      console.log('touchMove', mouse)
      if (mouse.pressed) {
        drawJoystick(canvas, mouse.x, mouse.y)
      }
      break
    }
  }
}

/**
 * Who knows?
 *
 * @param {} canvas -
 * @param {} e -
 *
 * @returns {} -
 */
function move (canvas, e) {
  console.log('move called')

  const mouse = getJoystick(e)
  if (mouse.pressed) {
    drawJoystick(canvas, mouse.x, mouse.y)
  }
}

/**
 * Draw the joystick in the UI and initialize it.
 *
 * @param {} canvas -
 * @param {boolean} notEventListener -
 */
function initJoystick (canvas, notEventListener = false) {
  console.log('initJoystick called')

  let mouse = { x: 0, y: 0 }
  let myTopic
  let pendingMouseup = false

  canvas.width = 200
  canvas.height = 130

  canvas.addEventListener(
    'redraw',
    e => {
      drawJoystick(canvas, 0, 0)
    },
    false)

  if (!notEventListener) {
    canvas.addEventListener(
      'mousedown',
      e => {
        pendingMouseup = true
        if (canvas.parentNode.id !== '_joystick') {
          myTopic = widgetArray[indexMap[canvas.parentNode.id]].topic
        }
        mouse = getJoystick(e)
        drawJoystick(canvas, mouse.x, mouse.y)
        document.onmousemove = move
      })

    document.addEventListener(
      'mouseup',
      e => {
        if (pendingMouseup) {
          pendingMouseup = false
          drawJoystick(canvas, 0, 0)
          document.onmousemove = null
        }
      })

    canvas.addEventListener(
      'touchstart',
      e => {
        pendingMouseup = true
        if (canvas.parentNode.id !== '_joystick') {
          myTopic = widgetArray[indexMap[canvas.parentNode.id]].topic
        }

        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].target.parentElement.id === canvas.parentElement.id) {
            mouse = getTouch(canvas, e, i)
            break
          }
        }

        drawJoystick(canvas, mouse.x, mouse.y)
        document.ontouchmove = touchMove
        console.log('touch start', e)
      })

    document.addEventListener(
      'touchend',
      e => {
        if (e.srcElement.parentElement.id === canvas.parentElement.id) {
          if (pendingMouseup) {
            e.preventDefault()
            pendingMouseup = false
            drawJoystick(canvas, 0, 0)
            document.addEventListener('touchmove', e => touchMove(e))
          }
          console.log('touch end', e)
        }
      })
  }
}

/**
 * Draw the joystick onto the canvas.
 *
 * @param {} canvas -
 * @param {} x -
 * @param {} y -
 * @param {boolean} mouseScreenCoords - true if using them
 *
 */
function drawJoystick (canvas, x, y, mouseScreenCoords = true) {
  /*
  const parent = canvas.parentNode
  let myTopic
  if (parent.id !== '_joystick' && parent.id !== '') {
    myTopic = widgetArray[indexMap[parent.id]].topic
  } else {
    myTopic = ''
  }
   */
  console.log('drawJoystick called')

  let normalPos = { x: 0, y: 0 }
  const context2d = canvas.getContext('2d')
  const mid = { x: canvas.width / 2, y: canvas.height / 2 }
  const smallestRadius = Math.min(mid.x, mid.y)
  const outerRad = smallestRadius - 10

  if (mouseScreenCoords) {
    let hypot = Math.hypot(x, y)
    if (hypot === 0) {
      hypot = 1
    }
    normalPos = { x: x / hypot, y: y / hypot }

    if (hypot > outerRad) {
      x = normalPos.x * outerRad
      y = normalPos.y * outerRad
    }
    normalPos = { x: x / outerRad, y: y / outerRad }

    // console.log('using screen',normalPos)
  } else {
    const hypot = Math.hypot(x, y)
    normalPos = { x, y }
    if (hypot > 1) {
      normalPos = { x: x / hypot, y: y / hypot }
      x /= hypot
      y /= hypot
    }
    x *= outerRad - 10
    y *= outerRad - 10
  }
  context2d.clearRect(0, 0, canvas.width, canvas.height)

  // outside ring
  context2d.beginPath()
  context2d.arc(mid.x, mid.y, outerRad, 0, 2 * Math.PI)
  context2d.fillStyle = '#828282'
  context2d.fill()

  // inside 'stick'
  context2d.beginPath()
  context2d.arc(mid.x + x, mid.y + y, smallestRadius / 4, 0, 2 * Math.PI)
  context2d.fillStyle = '#4d4d4d'
  context2d.fill()
  normalPos.y *= -1
  // TODO: Implement
  // sendToRos(myTopic, normalPos, '_joystick')
}

/**
//gauge widget
//let opts= {min:-50,max:50,bigtick:10,smalltick:5, title:'CPU temp'}
//drawGuage(document.getElementById("guageWidget"),0,opts)
function drawGauge(c,v,format){
  if(!format) format = {}
  opts = JSON.parse(canvas.getAttribute("data-config"))
  opts.min=Number(opts.min)
  opts.max=Number(opts.max)
  opts.bigtick=Number(opts.bigtick)
  opts.smalltick=Number(opts.smalltick)
  //v=v|opts.min
  if(v === undefined) v = opts.min
    y=canvas.height/2
    x=canvas.width/2
    r=Math.min(x,y)-10
    context2d = canvas.getContext("2d")

  context2d.clearRect(0,0,2*x,2*y)
  context2d.beginPath()
    context2d.arc(x, y, r, 0, 2 * Math.PI)
    context2d.fillStyle = '#FFF'
    context2d.fill()

    //outline
    context2d.strokeStyle = '#000'
    context2d.beginPath()
    context2d.arc(x, y, r, 0, 2 * Math.PI)
    context2d.closePath()
    context2d.lineWidth = 2
    context2d.stroke()
    context2d.beginPath()
    context2d.arc(x, y, r-r*0.05, 0, 2 * Math.PI)
    context2d.closePath()
    context2d.lineWidth = r*0.1
    context2d.strokeStyle = '#b8b8b8'
    context2d.stroke()

    let h = -Math.PI*1.4
    let ofst = + Math.PI*0.8
    let vr = opts.max-opts.min;//value range
    let nt = (vr/opts.bigtick) * (opts.smalltick)  //number of ticks
    let sth = h/nt; //small tick height
    let std = vr/nt;//small tick delta
    let zpos = y-(-opts.min/std)*sth;//pixel y where the scale is zero
    let cbh = zpos-(y-(v/std-opts.min/std)*sth);//calculated bar height
    let or = r*0.15
    let ir = r*0.3

    context2d.lineCap = 'round'
    context2d.font = (r*0.05+10)+"px Arial"
    context2d.fillStyle = "#5c5c5c"
    context2d.textAlign = 'center'

    for(let i = 0; i <= Math.min(nt,200); i++){
      context2d.beginPath()
      if(i%(opts.smalltick) === 0){
        context2d.moveTo(x+Math.cos(-i*sth+ofst)*(r-or),y+Math.sin(-i*sth+ofst)*(r-or))
        context2d.lineTo(x+Math.cos(-i*sth+ofst)*(r-ir),y+Math.sin(-i*sth+ofst)*(r-ir))
        context2d.lineWidth = 2
        context2d.strokeStyle = "#5c5c5c"
        context2d.fillText(Math.round( (i*std+opts.min) * 100 + Number.EPSILON ) / 100,x+Math.cos(-i*sth+ofst)*(r*0.9-ir),y+Math.sin(-i*sth+ofst)*(r*0.9-ir)+5)
      }
      else{
        context2d.moveTo(x+Math.cos(-i*sth+ofst)*(r-or),y+Math.sin(-i*sth+ofst)*(r-or))
        context2d.lineTo(x+Math.cos(-i*sth+ofst)*(r-ir*0.8),y+Math.sin(-i*sth+ofst)*(r-ir*0.8))
        context2d.lineWidth = 1.5
        context2d.strokeStyle = "#b8b8b8"
      }
      context2d.stroke()
    }
    context2d.fillStyle= '#000'
    context2d.font = (r*0.3)+"px Arial";'px Arial'
    context2d.fillText(formatNumber(v,format),x,y+r*0.7)
    context2d.fillStyle= '#666'
    context2d.font = (r*0.15)+"px Arial";'px Arial'
    context2d.fillText(opts.title,x,y-r*0.3)

    let a = ((v-opts.min)/(opts.max-opts.min)) * -h + ofst
    let tw = r*0.04
    context2d.beginPath()
    context2d.moveTo(x+Math.cos(a-3.14/2)*tw,y+Math.sin(a-3.14/2)*tw)
    context2d.lineTo(x+Math.cos(a)*r*0.8,y+Math.sin(a)*r*0.8)
    context2d.lineTo(x+Math.cos(a+3.14/2)*tw,y+Math.sin(a+3.14/2)*tw)
    context2d.fillStyle = 'rgba(255, 0, 0,0.4)'
    context2d.strokeStyle = 'rgb(255, 0, 0,0.5)'
    context2d.fill()
    context2d.stroke()

    context2d.beginPath()
    context2d.arc(x, y, r*0.15, 0, 2 * Math.PI)
    context2d.lineWidth = 2
    context2d.fillStyle = '#548aff'
    context2d.fill()

    context2d.strokeStyle = '#AAA'
    context2d.stroke()
  }

function drawArm(canvas, arms, angleArray){
  if (arms === undefined) {
    arms = [{mode:1,data:60,armlength:5,color:'#000000'},{mode:1,data:-90,armlength:3,color:'#00FF00'}]
  }
  let context2d = canvas.getContext("2d")
  context2d.clearRect(0,0,canvas.width,canvas.height)
  let rotation = 0
  let endpos = {x:0,y:0}
  let offset = {x:20,y:canvas.height/2 + 20}
  for(let i = 0; i < arms.length; i++){
    let data = 0, armlength = 3;
    if(arms[i].mode === 0){ //if using an array index instead of fixed angle
      if(angleArray !== undefined) if(angleArray[arms[i].data] !== undefined) data = angleArray[arms[i].data] * -0.01745
    }
    else data = arms[i].data * -0.01745; //convert degrees to radians
    armlength = arms[i].armlength * 20; //arm length multiplier

    canvas.lineWidth = 18
    canvas.lineCap = 'round'
    canvas.strokeStyle = arms[i].color
    canvas.beginPath()
    canvas.moveTo(offset.x+endpos.x, offset.y+endpos.y)
    canvas.lineTo(offset.x+endpos.x+Math.cos(data+rotation)*armlength, offset.y+endpos.y+Math.sin(data+rotation)*armlength)
    canvas.stroke()

    canvas.lineWidth = 7
    canvas.lineCap = 'round'
    canvas.beginPath()
    canvas.arc(offset.x+endpos.x, offset.y+endpos.y, 12, 0, 2 * Math.PI)
    canvas.fill()

    endpos.x += Math.cos(data+rotation)*armlength
    endpos.y += Math.sin(data+rotation)*armlength
    rotation += data
  }
}
 */
