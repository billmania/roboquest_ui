# configuration.json

## Description

The file configuration.json is used by both the backend and
frontend of the RoboQuest application software. The backend uses
it to support the UI widgets by determining where to connect to
the ROS graph for consuming from topics, producing to topics and
calling services. The frontend uses it to setup the widgets on the
browser page and associate two-way ROS-based data flow with
them.

There are two locations for the configuration file:
/public/config and /public/persist. The config directory is the
default version and the persist directory contains the current
configuration. At startup, the server checks for a
configuration.json file in /public/persist. If none exists, the
file from /public/config is copied to /public/persist. If a file
does exist in the persist directory the value of its version
property is compared with the same property in the config
directory. If they're the same, the persist copy is not modified.
If they're different, the file in persist is replaced with the
file from config. This may necessitate a reconfiguration of the
UI.


/public/persist is a reference to a directory on the host OS
filesystem and is the means for making a modified configuration
available for both new container instances and new images. It
also makes the UI configuration file contents available outside
of the RoboQuest application

## Sections

The configuration file has two sections, identified with the
properties "widgets" and "version"

### version

This document describes version 3 of the configuration file.

### widgets

The definition of the widgets placed on the page. The "widgets"
property is an array of objects uniquely identified with the two
properties "type" and "id" and separately by the one property
"label".

The are five widget types. New widgets can't be added at
run-time. Each widget has specific functionality and capability
which can't be modified at run-time. What is configured and
modified at run-time, via the browser UI, is how those widgets
interact with and control the application software.

The five widget types are:

        value: displays a numerical value by subscribing to a
               ROS topic numerical attribute

        button: the means for calling a ROS service with a
                configurable set of values

        indicator: displays one of two possible values based on
                   subscribing to a ROS topic boolean attribute

        slider: the means for publishing single numerical values onto a
                ROS topic

        joystick: the means for publishing pairs of numerical
                  values continuously onto a ROS topic

#### widget properties

[CSS reference](https://www.w3schools.com/cssref/index.php)
[widget lib](https://jqueryui.com/widget/)
[position lib](https://jqueryui.com/position/)
[button lib](https://jqueryui.com/button/)
[slider lib](https://jqueryui.com/slider/)
[joystick source](https://github.com/bobboteck/JoyStick)

the widget properties have the following sections:
        root: top level properties generic to all widgets
        position: properties for positioning the widget
        format: properties for formatting the display of the widget content
        data: topics and services associated with the widget

* id: unique integer for each widget
* type: string defining the widget type, from the set [value,
    indicator, button, slider, joystick]
* label: string displayed on the widget header and used to uniquely identify
         the widget

* position.my: string defining x,y of widget's position relative to the parent
* position.at: string defining x,y of parent's position

* format.prefix: (value) string prepended to the value before displaying
* format.suffix: (value) string appended to the value before displaying
* format.precision: (value) number of decimal places to display for values 

* format.trueText: (indicator) string displayed when state is true
* format.falseText: (indicator) string displayed when state is false
* format.trueColor: (indicator) color of text when state is true
* format.falseColor: (indicator) color of text when state is false

* format.min: (slider) minimum value of slider
* format.max: (slider) maximum value of slider
* format.step: (slider) increment value of dragging slider. when dragging
                        the slider a new value isn't emitted until it's at
                        least this amount different from the previous value
* format.reversed: (slider) reverse the values from the slider, ie. sliding
                            the knob toward the max value decreases the value.
                            yes or no
* format.orientation: (slider) horizontal or vertical
* format.default: (slider) default value of slider
* format.animate: (slider) true | false animate the slider when clicking to jump values
 
* format.text: (button) string displayed on the button

* data.topic: (value, indicator) ROS topic to subscribe
              (slider, joystick) ROS topic to publish

* data.topicType: (value, indicator, slider, joystick) ROS message type of
                                                       the topic
* data.topicDirection: (value, indicator, slider,  joystick)
                                            publish or subscribe
* data.topicAttribute: (value, indicator) single ROS message attribute to
                                          display
                       (joystick) ["x string path to attribute",
                                   "y string path to attribute"]
                       (slider) ["string path numeric value",
                                 "string path name associated"]
* data.topicPeriodS: (joystick) Only when data.topicDirection is "publish",
                                the browser UI will continually publish the
                                current value with a period of
                                data.topicPeriodS seconds
  
* data.service: (button) ROS service to call
* data.serviceType: (button) ROS service type of the service
* data.serviceAttribute: (button) ROS service attribute to set
* data.clickValue: (button) value when button is clicked

* data.scale : (joystick) floating point values array [x, y]

* keys: how keycodes map to widget actions. individual keycodes may only appear once
        in the configuration file. the quantity of keycodes per widget is limited
        only by the quantity of available keycodes. the format of the downValues and
        upValues object is fixed for each widget type. either downValues or upvalues
        may be absent from the keycode object.

    (joystick)
            "keys": {
              "32": {
                "name": "Space",
                "description": "Move forward at half speed",
                "downValues": { "x": 0, "y": 50 },
                "upValues": { "x": 0, "y": 0 }
              }
            }

    (slider)
            "keys": { 
              "81": { 
                "name": "KeyQ", 
                "description": "Reduce the slider value",
                "downValues": { "name": "Left", "value": -10 } 
              }
            }
    (button)
            "keys": {
              "190": {
                "name": "KeyPeriod",
                "description": "Click the button",
                "downValues": {}
              }
            }

