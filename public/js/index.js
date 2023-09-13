'use strict'

console.info(`rq_ui version ${RQ_PARAMS.VERSION} starting`)
console.info(`rq_ui config format version ${RQ_PARAMS.CONFIG_FORMAT_VERSION}`)

const keyControl = new KeyControl('#keyControl')

const getNextId = function () {
  let intId = 0
  $('.widget').each((i, element) => {
    const intWidgetId = parseInt($(element).data('widget-id'))
    if (intWidgetId > intId) {
      intId = intWidgetId
    }
  })
  return intId + 1
}

/*
  call the jquery position() with options for each widget.
  the widgets are from the loaded config file widgets:[] array. must already exist in the DOM
  necessary to be called again on things that might change the positions
  such as resize and adding / removing widgets
*/
const positionWidgets = function () {
  $('.widget').each((i, element) => {
    const objWidget = $(element).data('widget')
    $(element).position({
      ...objWidget.position,
      of: '#widgets',
      collision: 'none none'
    })
  })
}

$(window).on("resize", function() {
  positionWidgets()
})

/**
 * Instantiate a widget defined in the configuration file or
 * via the configuration menu.
 */
const createWidget = function (objWidget, objSocket) {
  // TODO: Instead of using upper case widget names for unique-ness, use the
  // TODO: rq widget namespace.
  const widgetTypeUpper = objWidget.type.toUpperCase()

  const widgetContainer = $(
    `<div class="widget ${widgetTypeUpper}" id="${objWidget.label}"></div>`
  )
  const widgetHeader = '<div class="widget-header">' + objWidget.label + '</div>'
  const widgetContent = '<div class="widget-content"></div>'
  $(widgetHeader).appendTo(widgetContainer)
  $(widgetContent).appendTo(widgetContainer)

  // TODO: Extract any keyboard configuration from the widget configuration
  if (Object.hasOwn(objWidget, 'keys')) {
    keyControl.addKeysForWidget(objWidget)
  }

  // store the data for the widget WITH the widget
  $(widgetContainer).data('widget', objWidget)

  console.group('createWidget')
  console.debug(`${JSON.stringify(objWidget)}`)
  console.groupEnd('createWidget')

  $(widgetContainer)[widgetTypeUpper](
      { ...objWidget, socket: objSocket }
    ).appendTo(
      '#widgets'
    ).draggable(
      {
      handle: '.widget-header',
      snap: true,

      /*
       * This function may be called once when the dragging of a widget
       * stops.
       */
      stop: function (event, ui) {
        console.debug('Empty stop function called')
      }
  })
}

$(function () {
  const objSocket = io(`${window.location.hostname}:${window.location.port}`,
    {
      transports: ['websocket'], 
      upgrade: false, 
      pingTimeout: RQ_PARAMS.PING_TIMEOUT_MS, 
      pingInterval: RQ_PARAMS.PING_INTERVAL_MS,
      timeout: RQ_PARAMS.SOCKET_TIMEOUT_MS
    }
  )
  objSocket.on('connect', () => {
    console.log('Connection to the robot established.')
  })
  objSocket.on('connect_error', (objError) => {
    console.log('Error connecting to robot. ', objError)
  })

  // need to have the image loaded before disconnect or else we cant request it when disconnected
  const imgDisconnected = new Image()
  imgDisconnected.src = RQ_PARAMS.DISCONNECTED_IMAGE

  objSocket.on('disconnect', (strReason) => {
    console.log('Connection to the robot has been lost. ', strReason)
    $('#mainImage').attr("src", imgDisconnected.src)
  })

  objSocket.on('mainImage', (bufImage) => {
    const strImage = btoa(String.fromCharCode(...new Uint8Array(bufImage)))
    document.getElementById('mainImage').src = `data:image/jpeg;base64,${strImage}`
  })

  /**
   * Use the details of a new widget, collected via the configuration menu, to
   * instantiate and position a new widget.
   */
  const addWidget = function () {
    const objNewWidget = {
      position: {},
      format: {},
      data: {}
    }
    $(this).find('#newWidgetForm input:visible, #newWidgetForm select:visible, #newWidgetType').each((i, element) => {
      if (element.value) {
        const strPropSection = $(element).data('section')
        console.log(strPropSection, element.name, element.value)
        if (strPropSection === 'root') {
          objNewWidget[element.name] = element.value
        }
        if (['format', 'data'].indexOf(strPropSection) > -1) {
          objNewWidget[strPropSection][element.name] = element.value
        }
      }
    })
    // these are one off logic to string concat the values, not a nice 1-1 mapping
    objNewWidget.position.my = `${$('#widgetPositionMyX').val()} ${$('#widgetPositionMyY').val()}`
    objNewWidget.position.at = `${$('#parentPositionAtX').val()} ${$('#parentPositionAtY').val()}`
    objNewWidget.id = getNextId()
    createWidget(objNewWidget, objSocket)
    positionWidgets()
  }

  $('#newWidget').dialog({
    width: 500,
    autoOpen: false,
    buttons: {
      Create: addWidget,
      Cancel: function () {
        $(this).dialog('close')
      }
    },
    open: function (event, ui) {
      $('#menuDialog').dialog('close')
    }
  })

  $('#menuDialog').dialog({
    width: 500,
    autoOpen: false,
    open: function (event, ui) {
      $('#newWidget').dialog('close')
    }
  })
  $('#configure').on('click', function () {
    $('#menuDialog').dialog('open')
  })
  $('#keyDrive').on('click', (eventData) => {
    keyDriveControl(eventData)
  })
  $('#addWidget').on('click', function () {
    $('#newWidget').dialog('open')
  })
  $('#saveConfig').on('click', function () {
    const objSaveConfig = {
      widgets: []
    }
    $('.widget').each((i, element) => {
      objSaveConfig.widgets.push($(element).data('widget'))
    })
    $.ajax({
      type: "POST",
      url: '/config',
      contentType: "application/json",
      data: JSON.stringify(objSaveConfig),
      success: function (objResponse) {
        console.log('Save Config Response', objResponse)
      },
      error: function(objRequest, strStatus, strError) {
        console.error("Error saving config:", strError);
      }
    });

  })

  $('#updateSoftware').on('click', function () {
    if (objSocket.connected) {
      objSocket.emit('control_hat', '{"set_charger": "ON"}')
      const intTimeS = Math.round(Date.now()/1000)
      objSocket.emit('update', `{"timestamp":"${intTimeS}", "version":"${RQ_PARAMS.UPDATE_FORMAT_VERSION}", "action":"UPDATE", "args":"UI"}`)
    }else{
      console.error('Not connected to the robot so an UPDATE is not possible. Check the robot.')
    }
  })

  $('#newWidget #newWidgetType').selectmenu({
    change: function (event, ui) {
      const widgetType = ui.item.value
      $('#newWidget .newWidgetType').hide()
      $(`#newWidget #${widgetType}`).show()
      console.log('change', widgetType)
    }
  })

  $('#trash').droppable({
    accept: '.widget',
    drop: function (event, ui) {
      console.log('dropped', ui.draggable.data('widget-id'))
      ui.draggable.remove()
      positionWidgets()
    }
  })

  $.ajax({
    url: RQ_PARAMS.CONFIG_FILE,
    dataType: 'json',
    success: function (data) {
      $.each(data.widgets, function (i, widget) {
        createWidget(widget, objSocket)
      })
      positionWidgets()
    }
  })
})
