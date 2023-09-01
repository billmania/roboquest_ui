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

const createWidget = function (objWidget, objSocket) {
  const widgetContainer = $(`<div class="widget ${objWidget.type.toUpperCase()}" data-widget-id="' + widget.id + '"></div>`)
  const widgetHeader = '<div class="widget-header">' + objWidget.label + '</div>'
  const widgetContent = '<div class="widget-content"></div>'
  $(widgetHeader).appendTo(widgetContainer)
  $(widgetContent).appendTo(widgetContainer)
  // store the data for the widget WITH the widget
  $(widgetContainer).data('widget', objWidget)
  // widget types are uppercase to avoid conflicts with jquery ui widget names
  $(widgetContainer)[objWidget.type.toUpperCase()](
      { ...objWidget, socket: objSocket }
    ).appendTo(
      '#widgets'
    ).draggable(
      {
      handle: '.widget-header',
      snap: true,
      stop: function (event, ui) {
        /*
        const widgetId = $(this).data('widget-id')
        const widgetPosition = $(this).position()
        console.log(widgetId, widgetPosition)
        */
      }
  })
}

$(function () {
  // const objSocket = io ('192.168.1.150:3456') // for development
  const objSocket = io(`${window.location.hostname}:${window.location.port}`,
    {
      transports: ['websocket'], 
      upgrade: false, 
      pingTimeout: 1000, 
      pingInterval: 1000,
      timeout: 1000
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

  // convert the image buffer to a base64 string and set the image source for main video
  objSocket.on('mainImage', (bufImage) => {
    const strImage = btoa(String.fromCharCode(...new Uint8Array(bufImage)))
    document.getElementById('mainImage').src = `data:image/jpeg;base64,${strImage}`
  })

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

  // setup the configuration menu
  $('#menuDialog').dialog({
    width: 500,
    autoOpen: false,
    open: function (event, ui) {
      $('#newWidget').dialog('close')
      $('#socketUri').val(objSocket.io.uri)
    }
  })
  $('#configure').on('click', function () {
    $('#menuDialog').dialog('open')
  })
  $('#setSocket').on('click', function () {
    objSocket.io.uri = $('#socketUri').val()
    objSocket.connect()
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

  // edit corner can add a new widget by clicking or tapping, or edit a widget that is dropped into it
  $('#edit').on('click', function () {
    $('#newWidget').dialog('open')
  }).droppable({
    accept: '.widget',
    drop: function (event, ui) {
      console.log('dropped', ui.draggable.data('widget-id'))
      ui.draggable.remove()
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

  // read the default config
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
