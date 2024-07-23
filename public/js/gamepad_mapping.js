'use strict'

/**
 * Mapping the gamepad buttons and axes names to their type and index.
 */

/**
 * An object to map button and axis indices to a descriptive name AND
 * provide some information. If the entry in the 'buttons' and 'axes'
 * array is a string, that's the descriptive name and the entry is to
 * be treated like a simple button, ie. it has the 'pressed' property.
 * If instead the entry is itself a 3 element array, then the first
 * entry is the descriptive name, the second is the released value,
 * and the third is the minimum value.
 */
const gamepadMaps = { // eslint-disable-line no-unused-vars
  '©Microsoft Corporation Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)': {
    b: [
      'A',
      'B',
      'Y',
      'X',
      'Left index',
      'Right index',
      'na',
      'na',
      'Back',
      'Start',
      'Left joy press',
      'Right joy press',
      'Up D-PAD',
      'Down D-PAD',
      'Left D-PAD',
      'Right D-PAD',
      'Big'
    ],
    a: [
      ['Left joy horiz', 0.0, -1.0],
      ['Left joy vert', 0.0, -1.0],
      ['Right joy horiz', 0.0, -1.0],
      ['Right joy vert', 0.0, -1.0],
      ['Left trigger', -1.0, -1.0],
      ['Right trigger', -1.0, -1.0]
    ]
  },
  '046d-c21d-Logitech Gamepad F310': { // Firefox/ubuntu
    b: [
      'A',
      'B',
      'Y',
      'X',
      'Left index',
      'Right index',
      'na',
      'na',
      'Back',
      'Start',
      'Left joy press',
      'Right joy press',
      'Up D-PAD',
      'Down D-PAD',
      'Left D-PAD',
      'Right D-PAD',
      'Big'
    ],
    a: [
      ['Left joy horiz', 0.0, -1.0],
      ['Left joy vert', 0.0, -1.0],
      ['Right joy horiz', 0.0, -1.0],
      ['Right joy vert', 0.0, -1.0],
      ['Left trigger', -1.0, -1.0],
      ['Right trigger', -1.0, -1.0]
    ]
  },
  'Logitech Gamepad F310 (STANDARD GAMEPAD Vendor: 046d Product: c21d)': { // Chrome/ubuntu
    b: [
      'A',
      'B',
      'X',
      'Y',
      'Left index',
      'Right index',
      ['Left trigger', 0.0, 0.0],
      ['Right trigger', 0.0, 0.0],
      'Back',
      'Start',
      'Left joy press',
      'Right joy press',
      'Up D-PAD',
      'Down D-PAD',
      'Left D-PAD',
      'Right D-PAD',
      'Big'
    ],
    a: [
      ['Left joy horiz', 0.0, -1.0],
      ['Left joy vert', 0.0, -1.0],
      ['Right joy horiz', 0.0, -1.0],
      ['Right joy vert', 0.0, -1.0]
    ]
  },
  'Xbox 360 Controller (XInput STANDARD GAMEPAD)': { // Chrome/Windows
    b: [
      'A',
      'B',
      'X',
      'Y',
      'Left index',
      'Right index',
      ['Left trigger', 0.0, 0.0],
      ['Right trigger', 0.0, 0.0],
      'Back',
      'Start',
      'Left joy press',
      'Right joy press',
      'Up D-PAD',
      'Down D-PAD',
      'Left D-PAD',
      'Right D-PAD',
      'Big'
    ],
    a: [
      ['Left joy horiz', 0.0, -1.0],
      ['Left joy vert', 0.0, -1.0],
      ['Right joy horiz', 0.0, -1.0],
      ['Right joy vert', 0.0, -1.0]
    ]
  }
}
