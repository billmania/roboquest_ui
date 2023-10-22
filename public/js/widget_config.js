'use strict'

/* global jQuery RQ_PARAMS */

/**
 * Extends jQuery. To be called on a jQuery element of class 'widget'.
 *
 *  @returns {object} - a complete widget configuration object.
 */
jQuery.fn.getWidgetConfiguration = function () {
  return this.data(RQ_PARAMS.WIDGET_NAMESPACE)
}

/**
 * Determine the greatest widget ID integer already assigned to a widget.
 * Return that integer + 1. ID numbers must be non-negative.
 *
 *  @returns {number} - the next widget ID
 */
const getNextId = function () { // eslint-disable-line no-unused-vars
  let greatestId = -1
  jQuery('.widget').each((i, element) => {
    const widgetId = parseInt(jQuery(element).getWidgetConfiguration().id)
    if (widgetId > greatestId) {
      greatestId = widgetId
    }
  })

  return greatestId + 1
}

/**
 * Used in two scenarios: the first time the page is rendered; every time
 * the page is resized. The function uses the widgets' configuration from
 * the configuration file which was saved using the jQuery.data() function.
 * Added widgets must have their configuration added via jQuery.data() too.
 *
 *  CSS element selectors reminder:
 *  . find the collection of elements with this CSS class attribute
 *  # find the element with this unique HTML ID attribute
 *  * find the collection of every HTML element on the page
 *
 */
const positionWidgets = function () {
  jQuery('.widget').each((i, element) => {
    const objWidget = jQuery(element).getWidgetConfiguration()
    jQuery(element).position({
      ...objWidget.position,
      of: '#widgets',
      collision: 'none none'
    })
  })
}

jQuery(window).on('resize', function () {
  positionWidgets()
})

/**
 * Update the recorded position of the widget with newPosition.
 *
 * @param {object} oldPosition - the old, complete position
 * @param {object} newPosition - the new top and left offset
 *
 * @returns {object} - a complete position object
 */
const updateWidgetPosition = function (oldPosition, newPosition) {
  oldPosition.at = `left+${newPosition.left} top+${newPosition.top}`
  return oldPosition
}

/**
 * Instantiate a widget defined in the configuration file or
 * via the configuration menu.
 *
 * The widget's configuration label attribute is used to find a specific
 * widget.
 *
 * The structure of a new widget is comprised of three parts:
 * 1. the top level, all-encompassing element is a widgetContainer and is
 *    and HTML DIV with the CSS class "widget" and widgetType. it also
 *    has an HTML ID unique to this widget
 * 2. the widgetContainer includes a widgetHeader which shows the
 *    widget's label
 * 3. the widgetContainer lastly includes the widgetContent. the content
 *    is an HTML DIV with the CSS class "widget-content".
 *
 */
const createWidget = function (objWidget, objSocket) { // eslint-disable-line no-unused-vars
  // TODO: Instead of using upper case widget names for unique-ness, use the
  // TODO: rq widget namespace.
  const widgetTypeUpper = objWidget.type.toUpperCase()

  // TODO: Figure out how to replace the string 'widget' with a constant
  const widgetContainer = jQuery(
    `<div class="widget ${widgetTypeUpper}" id="${objWidget.label}"></div>`
  )
  const widgetHeader = '<div class="widget-header">' + objWidget.label + '</div>'
  const widgetKebobMenu = jQuery(
    '<img class="kebobMenu" src="img/kebobMenu.png"/>'
  )
  const widgetContent = '<div class="widget-content"></div>'

  widgetKebobMenu.appendTo(widgetContainer)
  jQuery(widgetHeader).appendTo(widgetContainer)
  jQuery(widgetContent).appendTo(widgetContainer)

  if (Object.hasOwn(objWidget, 'keys')) {
    keyControl.addKeysForWidget(objWidget) // eslint-disable-line no-undef
  }

  /*
   * Store the widget configuration object (objWidget) under the WIDGET_NAMESPACE
   * in an arbetrary jQuery data unit attatched to the widgetContainer
   */
  jQuery(widgetContainer).data(RQ_PARAMS.WIDGET_NAMESPACE, objWidget)

  console.debug(`${JSON.stringify(objWidget)}`)

  jQuery(widgetContainer)[widgetTypeUpper](
    { ...objWidget, socket: objSocket }
  ).appendTo(
    '#widgets'
  ).draggable({
    handle: '.widget-header',
    snap: true,
    start: function (event, ui) {
      const widgetId = event.currentTarget.id
      console.debug(
        `drag started on ${widgetId}` +
        ` at position ${JSON.stringify(jQuery('#' + widgetId).position())}` +
        ` and offset ${JSON.stringify(jQuery('#' + widgetId).offset())}`
      )
    },
    stop: function (event, ui) {
      const widgetId = event.target.id
      const widgetData = jQuery('#' + widgetId).getWidgetConfiguration()

      if (!widgetData) {
        /*
         * The widgetData no longer exists, likely because the widget was deleted from the UI. That condition
         * is acceptable here.
         */
        return
      }

      const widgetPosition = widgetData.position

      console.debug(
        `drag stopped on ${widgetId}` +
        ` at offset ${JSON.stringify(jQuery('#' + widgetId).offset())}` +
        ` and position ${JSON.stringify(jQuery('#' + widgetId).position())}` +
        ` original ${JSON.stringify(widgetPosition)}`
      )

      jQuery('#' + widgetId).getWidgetConfiguration().position = updateWidgetPosition(
        widgetPosition,
        jQuery('#' + widgetId).position()
      )
      console.debug(
        ` updated position to: ${JSON.stringify(jQuery('#' + widgetId).getWidgetConfiguration().position)}`
      )
    }
  }).hover(function (event) {
    jQuery(event.currentTarget).find('.kebobMenu')[0].style.display = 'block'
  },
  function (event) {
    jQuery(event.currentTarget).find('.kebobMenu')[0].style.display = 'none'
  })

  widgetKebobMenu.on('click', function (event) {
    console.log('Clicked on kebob menu for widget #' + event.target.closest('.widget').id)
    const widgetConfig = jQuery(event.target.closest('.widget')).getWidgetConfiguration()

    populateWidgetConfigurationDialog(widgetConfig)

    jQuery('#newWidget').dialog({
      title: 'Configure Widget'
    }).dialog('open')
  })
}

const setNewWidgetDialogType = function (widgetType) {
  jQuery('#newWidget .newWidgetType').hide()
  jQuery(`#newWidget #${widgetType}`).show()
}

const populateWidgetConfigurationDialog = function (widgetConfig) {
  jQuery('#newWidget').find('[data-section]').each((i, element) => {
    const strPropSection = jQuery(element).data('section')
    console.log(strPropSection, element.name, element.value)

    if (strPropSection === 'root') {
      if (Object.hasOwn(widgetConfig, element.name)) {
        if (element.name === 'type') {
          jQuery('#newWidgetType').val(widgetConfig[element.name]).selectmenu('refresh');
          setNewWidgetDialogType(widgetConfig[element.name])
        } else {
          element.value = widgetConfig[element.name]
        }
      }
    }

    if (strPropSection === 'format') {
      if (Object.hasOwn(widgetConfig[strPropSection], element.name)) {
        element.value = widgetConfig[strPropSection][element.name]
      }
    }
    if (strPropSection === 'data') {
      if (Object.hasOwn(widgetConfig[strPropSection], element.name)) {
        const configValue = widgetConfig[strPropSection][element.name]
        if (typeof (configValue) === 'object' && Array.isArray(configValue)) {
          element.value = configValue.join(RQ_PARAMS.ATTR_DELIMIT)
        } else {
          element.value = configValue
        }
      }
    }
  })
}

const initWidgetConfig = function (objSocket) { // eslint-disable-line no-unused-vars
  /**
     * Use the details of a new widget, collected via the configuration menu, to
     * instantiate and position a new widget.
     * It's called by clicking the "Create" button in the "Configure a New Widget"
     * form which implies this function needs a better name.
     */
  // TODO: Give this function a more intuitive name based on its use and effect
  const addWidget = function () {
    const objNewWidget = {
      position: {},
      format: {},
      data: {}
    }
    jQuery(this)
      .find(
        '#configureNewWidget input:visible, #configureNewWidget select:visible, #newWidgetType'
      )
      .each((i, element) => {
        // TODO: Provide a reasonable default value for element.value
        if (element.value) {
          const strPropSection = jQuery(element).data('section')
          console.debug(strPropSection, element.name, element.value)
          if (strPropSection === 'root') {
            objNewWidget[element.name] = element.value
          }
          if (strPropSection === 'format') {
            /*
               * Some format values are integers.
               */
            const value = parseInt(element.value)
            if (isNaN(value)) {
              objNewWidget[strPropSection][element.name] = element.value
            } else {
              objNewWidget[strPropSection][element.name] = value
            }
          }
          if (strPropSection === 'data') {
            /*
               * The topicAttribute element may contain multiple attributes.
               * When found, assemble them into an Array of strings.
               */
            if (element.value.indexOf(RQ_PARAMS.ATTR_DELIMIT) > -1) {
              const attributes = element.value
                .replaceAll(' ', '')
                .split(RQ_PARAMS.ATTR_DELIMIT)
              objNewWidget[strPropSection][element.name] = attributes
            } else {
              objNewWidget[strPropSection][element.name] = element.value
            }
          }
        }
      })
      // these are one off logic to string concat the values, not a nice 1-1 mapping
    objNewWidget.position.my = `${jQuery('#widgetPositionMyX').val()} ${jQuery('#widgetPositionMyY').val()}`
    objNewWidget.position.at = `${jQuery('#parentPositionAtX').val()} ${jQuery('#parentPositionAtY').val()}`
    objNewWidget.id = getNextId()

    createWidget(objNewWidget, objSocket)
    positionWidgets()
  }
  jQuery('#newWidget').dialog({
    width: 500,
    autoOpen: false,
    buttons: {
      Create: addWidget,
      Done: function () {
        jQuery(this).dialog('close')
      }
    },
    open: function (event, ui) {
      jQuery('#menuDialog').dialog('close')
    }
  })

  jQuery('#newWidget #newWidgetType').selectmenu({
    change: function (event, ui) {
      setNewWidgetDialogType(ui.item.value)
    }
  })

  jQuery('#addWidget').on('click', function () {
    jQuery('#newWidget').dialog({
      title: 'Configure a New Widget'
    }).dialog('open')
  })
}
