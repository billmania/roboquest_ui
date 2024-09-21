'use strict'

/* global jQuery */

jQuery(document).ready(function () {
  console.log('select_manipulation Starting')

  let optionNumber = 0

  jQuery('#query')
    .on('click', function () {
      let selected
      let results = ''
      for (const selectId of ['#select1', '#select2']) {
        selected = jQuery(selectId)
        results = results + `${selectId} value: ${selected.val()}<br>`
        selected
          .find('option')
          .each((index, element) => {
            results = results + ` ${index}: ${element.value}<br>`
          })
      }
      jQuery('#messages').html(results)
    })

  jQuery('#add')
    .on('click', function () {
      let selected
      for (const selectId of ['#select1', '#select2']) {
        selected = jQuery(selectId)
        optionNumber++
        selected.append(`<option value="option${optionNumber}">option${optionNumber}</option>`)
      }
      jQuery('#messages').html('<p>Added</p>')
    })

  /**
   * Does NOT trigger the change event.
   */
  jQuery('#set')
    .on('click', function () {
      const setValue = jQuery('#input1').val()

      for (const selectId of ['#select1', '#select2']) {
        jQuery(selectId)
          .find(`option:eq(${setValue})`)
          .attr('selected', 'selected')
        jQuery(selectId).trigger('change')
      }
      jQuery('#messages').html(`<p>Set ${setValue}</p>`)
    })

  jQuery('#setByValue')
    .on('click', function () {
      const setValue = jQuery('#input1').val()

      for (const selectId of ['#select1', '#select2']) {
        jQuery(selectId)
          .find(`option[value=${setValue}]`)
          .attr('selected', 'selected')
        jQuery(selectId).trigger('change')
      }
      jQuery('#messages').html(`<p>SetByValue ${setValue}</p>`)
    })

  jQuery('#remove')
    .on('click', function () {
      for (const selectId of ['#select1', '#select2']) {
        jQuery(selectId).find('option:last').remove()
      }
      jQuery('#messages').html('<p>Removed last option</p>')
    })

  jQuery('#select1')
    .change(
      function (event) {
        changeEvent(event)
      }
    )

  jQuery('#select2')
    .change(
      function (event) {
        changeEvent(event)
      }
    )

  const changeEvent = function (event) {
    const previousEvents = jQuery('#events').html()
    jQuery('#events')
      .html(previousEvents + `<p>Change event on ${event.target.id}</p>`)
  }
})
