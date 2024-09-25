'use strict'
/* global RQ_PARAMS */

const DONT_SCALE = 1 // eslint-disable-line no-unused-vars
const DEFAULT_VALUE = 'DefaultValue' // eslint-disable-line no-unused-vars

/**
 * Utility function to assign a value to a specific attribute.
 * It modifies its first argument.
 * this.options.data.topicAttribute is expected to be an Array
 * with at least one member. The member can be the empty string,
 * or an attribute name with a constant value, or an attribute
 * name alone. When a value is a Number and assigned to an
 * attribute, and if scaling is provided, the value will be scaled.
 *
 * @param {object} payload - the payload object
 * @param {string} topicAttr - the topic attribute
 * @param {number} scale - how to scale the value
 * @param {number} value - widget value to assign to the attribute
 */
const assignValue = function ( // eslint-disable-line no-unused-vars
  payload,
  topicAttr,
  scale,
  value) {
  if (topicAttr !== '') {
    if (topicAttr.indexOf(
      RQ_PARAMS.VALUE_DELIMIT) === -1) {
      /*
       * No constant included, so assign the passed value.
       */
      if (!isNaN(parseInt(value))) {
        payload[topicAttr] = (
          value * scale
        )
      } else {
        payload[topicAttr] = (
          value
        )
      }
    } else {
      const nameAndValue = topicAttr
        .split(RQ_PARAMS.VALUE_DELIMIT)
      const valueAsNumber = parseInt(nameAndValue[1])
      if (isNaN(valueAsNumber)) {
        payload[nameAndValue[0]] = nameAndValue[1]
      } else {
        payload[nameAndValue[0]] = valueAsNumber
      }
    }
  }
}
