# configuration.json

## Description

The file configuration.json is used by both the backend and frontend of the RoboQuest
application software. The backend uses it to determine how to connect to the ROS
graph for topic subscriptions, topic publishing, and service calls. The frontend
uses it to setup the widgets on the browser pages and associate two-way ROS-based 
data flow with them.

There are two locations for the configuration file: /public/config and
/public/persist. When the server receives a GET request for the configuration, if
the file exists in /public/persist, that file is returned and /public/config is ignored.
Otherwise, the file from /public/config is returned.

When the server receives a POST request to save a modified version of the
configuration, it's always written to /public/persist. On a new, never-before-used
installation, the configuration file exists only in the /public/config directory.
/public/persist is a reference to a docker volume on the host OS filesystem and is
the means for making a modified configuration available for both new container instances
and new images.

## Sections

The configuration file has four main sections and then several key-value pairs.

### widgets

The definition of the widgets placed on the page. The "widgets" property is
an array of objects uniquely identified with the properties "type" and "id".

widget types:
        value: displayed float value
        button: emit a value when clicked
        indicator: display boolean state
        slider: emit value in a range
        joystick: emit x,y values in a range

#### widget properties

[CSS reference](https://www.w3schools.com/cssref/index.php)
[widget lib](https://jqueryui.com/widget/)
[position lib](https://jqueryui.com/position/)
[button lib](https://jqueryui.com/button/)
[slider lib](https://jqueryui.com/slider/)

the widget properties have the following sections:
        root: top level properties generic to all widgets
        position: properties for positioning the widget
        format: properties for formatting the display of the widget content
        data: topics and services associated with the widget

* id: unique integer for each widget
* type: string defining the widget type
* label: string displayed on the widget header

* position.my: string defining x,y of widget to position with respect to the parent
* position.at: string defining x,y of parent to position widget

* format.prefix: (value) string prepended to the value before displaying
* format.suffix: (value) string appended to the value before displaying
* format.precision: (value) number of decimal places to display for values 

* format.trueText: (state) string displayed when state is true
* format.falseText: (state) string displayed when state is false
* format.trueColor: (state) color of text when state is true
* format.falseColor: (state) color of text when state is false

* format.min: (slider) minimum value of slider
* format.max: (slider) maximum value of slider
* format.step: (slider) increment value of slider
* format.orientation: (slider) horizontal or vertical
* format.default: (slider) default value of slider
* format.animate: (slider) true | false animate the slider when clicking to jump values
 
* format.text: (button) string displayed on the button

* data.topic: (value, state, joystick) ROS topic to subscribe to
* data.topicType: (value, state, joystick) ROS message type of the topic
* data.topicDirection: (value, state, joystick) ROS topic direction (pub/sub)
* data.topicAttribute: (value, indicator) ROS message attribute to display
* data.topicAttribute: (slider) must be an array for a slider. First element is for the key used for the slider value, second element is for the key used for the slider label == servo name on ros2
* data.topicPeriodS: (joystick, slider) Only when data.topicDirection is "publish",
                                        the browser UI will continually publish the
                                        current value with a period of
                                        data.topicPeriodS seconds. To remove the repeat functionality you can set to 0.
  
* data.service: (button) ROS service to call
* data.serviceType: (button) ROS service type of the service
* data.serviceAttribute: (button) ROS message attribute to display
* data.clickValue: (button) value to emit when button is clicked


* data.scale : (joystick) floating point values array [x, y]
* data.topicAttribute: (joystick) ["x string path to attribute", "y string path to attribute"]
### config

Configuration details for cameras and macros.

#### cams

#### macros

#### other stuff
