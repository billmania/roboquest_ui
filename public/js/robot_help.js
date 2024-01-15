'use strict'

/**
 * The preparation steps for doing stuff to the robot.
 *
 */

const RQRebootHelp = {}

RQRebootHelp.version = 1
RQRebootHelp.steps = []
RQRebootHelp.steps.push('Set the HAT UI to screen 4')
RQRebootHelp.steps.push('Click the Reboot button')
RQRebootHelp.steps.push('"reboot start" may appear on screen 4')
RQRebootHelp.steps.push('Wait for the HAT UI to show only HAT setup')
RQRebootHelp.steps.push('Reload the browser page')

const RQShutdownHelp = {}

RQShutdownHelp.version = 1
RQShutdownHelp.steps = []
RQShutdownHelp.steps.push('Set the HAT UI to screen 4')
RQShutdownHelp.steps.push('Click the Shutdown button')
RQShutdownHelp.steps.push('"shutdown start" may appear on screen 4')
RQShutdownHelp.steps.push('Wait 20 seconds then manually remove power')
