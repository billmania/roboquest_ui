/**
 * Utilities for working with widgets.
 */

/**
 * For DEFAULT_IMAGE_INDEX, bear in mind it's hard-coded in rq_testing.html.
 */
const DEFAULT_IMAGE_Z_INDEX = -50
const DEFAULT_Z_INDEX = 20
const BOX_Z_INDEX = 5

/**
 * Set the style of the widget using its description.
 *
 * @param {} tile -
 * @param {JSON} widget - The JSON object describing the widget.
 */
function setWidgetStyle (tile, widget) {
  if (widget.useTop) {
    tile.style.top = widget.top
    tile.style.bottom = ''
  } else {
    tile.style.top = ''
    tile.style.bottom = widget.bottom
  }
  if (widget.useLeft) {
    tile.style.right = ''
    tile.style.left = widget.left
  } else {
    tile.style.left = ''
    tile.style.right = widget.right
  }
  tile.style.width = widget.w
  tile.style.height = widget.h
}

/**
 * Find the widgetType widget from the widget menu and duplicate it.
 * Returns a new widget-clone as a dragable half-functional widget.
 *
 * This function maps the "type" of a widget in a configuration file
 * to the DOM "id" of a widget in the widget menu.
 *
 * @param {string} widgetType - The DOM id of the widget in the menu.
 *
 * @returns {} - A clone of the widget.
 */
function makeNewWidget (widgetType) {
  const menuWidget = document.getElementById(widgetType)
  if (!menuWidget) {
    console.log(`widget with type ${widgetType} does not exist`)
    return
  }
  const widgetClone = menuWidget.cloneNode(true)

  widgetClone.className = 'panel dragable'
  const widgetHeader = widgetClone.querySelector('#header')
  if (widgetHeader) {
    widgetClone.querySelector('#header').style = 'padding:11px;'
    widgetClone.querySelector('#header').childNodes[0].data = ''
  } else {
    console.log(`No widget header for ${widgetType}`)
  }
  widgetClone.id = ''

  const configButton = widgetClone.querySelector('#configButton')
  if (configButton) {
    // show the gear icon to allow for configuration of the widget
    configButton.style.display = 'inline-block'
  }

  document.getElementById('body').appendChild(widgetClone)

  return widgetClone
}

/**
 * Use the definition of a widget to configure it on the page.
 *
 * @param {Object} widgetConfig - The object which describes the widget.
 * @param {function} sendEvent - the function used by the widget to send
 *                               data it created. it's called with two
 *                               arguments, an event name and an
 *                               Array of values.
 *
 * @returns {Object} - the new widget
 */
function addWidget (widgetConfig, sendEvent) {
  let canvas = null
  let imageAp = null
  let rqJoystick = null

  if (!widgetConfig.type) {
    console.log(`widget ${widgetConfig} does not have a type so cannot be created`)
    return
  }
  const tile = makeNewWidget(widgetConfig.type)
  if (!tile) {
    console.log(`widget type ${widgetConfig.type} doesn't exist in this version of UI`)
    return
  }

  tile.id = widgetConfig.id
  if (widgetConfig.type === '_box') {
    tile.style.zIndex = BOX_Z_INDEX
  } else {
    tile.style.zIndex = DEFAULT_Z_INDEX
  }

  tile.style.width = widgetConfig.w
  tile.style.height = widgetConfig.h
  tile.style.display = ''

  switch (widgetConfig.type) {
    case '_button':
      tile.querySelector('#button_ap').innerText = widgetConfig.label
      if (widgetConfig.fontsize) tile.querySelector('#button_ap').style.fontSize = parseFloat(widgetConfig.fontsize) + 'px'
      break

    case '_checkbox':
      tile.querySelector('#checkbox_text_ap').innerText = widgetConfig.label
      tile.querySelector('#checkbox_ap').checked = widgetConfig.initial
      tile.querySelector('#checkbox_text_ap').style.color = widgetConfig.textColor
      // TODO: Implement
      /*
      if (widgetConfig.latching) {
        sendToRos(
          widgetConfig.topic,
          { value: widgetConfig.initial ? widgetConfig.onPress : widgetConfig.onRelease },
          '_checkbox')
      }
       */
      break

    case '_joystick':
      canvas = tile.querySelector('#joystickCanvas')
      canvas.height = parseInt(widgetConfig.h)
      canvas.width = parseInt(widgetConfig.w)
      tile['callback'] = (payload) => {
        sendEvent(widgetConfig.topic, JSON.stringify(payload))
      }
      rqJoystick = new RQJoystick(
        canvas.height / 3,
        canvas,
        tile.callback
      )
      break

    case '_trigger':
      tile.querySelector('#paddle_background').style.background = widgetConfig.back
      tile.querySelector('#paddle_ap').style.background = widgetConfig.bar
      break

    case '_slider':
      tile.querySelector('#slider_ap').min = widgetConfig.min
      tile.querySelector('#slider_ap').max = widgetConfig.max
      tile.querySelector('#slider_ap').value = (parseInt(widgetConfig.min) + parseInt(widgetConfig.max)) / 2
      tile.querySelector('#slider_ap').step = widgetConfig.step
      break

    case '_value':
      tile.querySelector('#text_ap').innerText = widgetConfig.prefix
      tile.prefix = widgetConfig.prefix
      tile.suffix = widgetConfig.suffix
      tile.querySelector('#text_ap').style.color = widgetConfig.textColor
      break

    case '_indicator':
      tile.querySelector('#text_ap').innerText = widgetConfig.text
      break

    case '_audio':
      tile.querySelector('#speaker_ap').className = widgetConfig.hideondrive ? '' : 'showOnDrive'
      break

    case '_gauge':
      canvas = tile.querySelector('#gauge_ap')
      canvas.height = parseInt(widgetConfig.h) - 20
      canvas.width = parseInt(widgetConfig.w)
      canvas.setAttribute('data-config', JSON.stringify({ min: widgetConfig.min, max: widgetConfig.max, bigtick: widgetConfig.bigtick, smalltick: widgetConfig.smalltick, title: widgetConfig.label }))
      // TODO: Implement
      // drawGauge(canvas, widgetConfig.min, widget)
      break

    case '_rosImage':
      imageAp = tile.querySelector('#imageAp')
      if (widgetConfig.src) imageAp.src = widgetConfig.src
      if (widgetConfig.aspr) imageAp.className = 'showOnDrive containImage'
      if (widgetConfig.opac) imageAp.style.opacity = widgetConfig.opac + '%'
      break

    case '_arm':
      canvas = tile.querySelector('#arm_ap')
      canvas.height = parseInt(widgetConfig.h) - 20
      canvas.width = parseInt(widgetConfig.w)
      // TODO: Implement
      // drawArm(canvas, widgetConfig.arms)
      break

    case '_dropdown':
      // TODO: Implement
      // tile.querySelector('#selector_ap').innerHTML = generateSelectorOptions(widgetConfig.dropdowns)
      break

    case '_text':
      tile.querySelector('#text_ap').innerText = widgetConfig.text
      tile.querySelector('#text_ap').style.color = widgetConfig.textColor
      break

    case '_box':
      tile.querySelector('#panel_ap').style.backgroundColor = widgetConfig.bkColor
      break

    case '_speaker':
      tile.querySelector('#label_ap').innerText = widgetConfig.label || ''
      break
  }

  setWidgetStyle(tile, widgetConfig)

  // TODO: Implement
  // initFunctionality(widget.type, tile, tile.id)

  return tile
}

/**
 * Define the contents of the RQ page using the configuration.
 *
 * First, remove all of the dynamic elements, which are identified with
 * the class "panel" and "dragable". Next, set some names and background
 * colors. Lastly, iterate through this.widgetArray calling addWidget()
 * for each member.
 *
 * The intent of the class "panel dragable" is not (yet) clear, since there
 * aren't any in the initial HTML page.
 *
 * If the configuration says to start in edit mode or if the browser
 * is identified as a "mobile" device, either toggle drive mode or
 * show the widget holder.
 *
 * @param {Object} configuration - The contents of the configuration file.
 * @param {function} socket - a function which takes two arguments: an
 *                               event name and a payload. used to send data
 *                               created by widgets to the server.
 *
 * @returns {Object} - the collection of created widgets, indexed using the
 *                     configuration "id" attribute as the property name.
 */
function buildPage (configuration, callback) {
  const configSettings = configuration.config
  const widgetArray = configuration.widgets
  const widgetsList = {}

  if (!configSettings || !widgetArray) {
    console.log(`Neither configSettings nor widgetArray found in: ${configuration}`)
    return
  }

  const allDynamicElements = document.getElementsByClassName('panel dragable')
  for (let i = allDynamicElements.length - 1; i >= 0; i--) {
    allDynamicElements[i].remove()
  }

  document.getElementById('consoleName').innerText = configSettings.consoleName
  document.getElementById('title').innerText = configSettings.consoleName
  document.getElementById('body').style.backgroundColor = configSettings.background

  for (const widgetConfig of widgetArray) {
    const addedWidget = addWidget(widgetConfig, callback)
    if (addedWidget.id !== '') {
      widgetsList[widgetConfig.id] = addedWidget
    }
  }

  return widgetsList
}
