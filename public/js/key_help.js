'use strict'

/**
 * The descriptive and help text about assigning keys for each type of widget.
 */

const RQKeysHelp = {}

RQKeysHelp.version = 1

RQKeysHelp.joystick = 'The joystick widget produces two number values, x and y. y is the position of the joystick forward and backward. x is the position side to side. The range for both x and y is [-100, 100]. When assigning a key to the joystick, specify the x and y values like "x: 50, y:0" where 50 and 0 can be any value in [-100, 100].'

RQKeysHelp.button = 'The button widget only produces a click event - it doesn\'t produce any value itself. The ON Press and On Release fields are ignored.'

RQKeysHelp.slider = 'The slider widget produces a single value in the range defined when the widget was configured. When assigning a key to the slider, specify the On Press and/or On Release like "name:Whatever,value:4" where Whatever is a name of your choosing and 4 is any number in range.'
