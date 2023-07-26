# configuration.json

## Description

The file configuration.json is used by both the backend and frontend of the RoboQuest
application software. The backend uses it to determine how to connect to the ROS
graph for topic subscriptions, topic publishing, and service calls. The frontend
uses it to setup the widgets on the browser pages and associate two-way ROS-based 
data flow with them.

## Sections

The configuration file has four main sections and then several key-value pairs.

### widgets

The definition of the widgets placed on the page. The "widgets" property is
an array of objects uniquely identified with the properties "type" and "id".

#### widget CSS properties

[CSS reference](https://www.w3schools.com/cssref/index.php)

* bigtick
* bkColor
* bottom - a string in the format "#px" interpreted as the number of pixels from
           the bottom edge of the parent element.
* childids
* default
* falseText - what's displayed when msgAttribute is a boolean and false
* fontsize
* formatmode
* formatvalue
* gp_Decrease
* gp_Increase
* h - the height of the widget as "#px".
* id - a unique integer for each widget
* label
* latching
* left - a string in the format "#px" interpreted as the number of pixels from
         the left edge of the parent element.
* max
* min
* msgAttribute - which attribute(s) from the msgType on the topic, like 'header.stamp.sec',
*                separated by semi-colon(s)
* msgType - a string defining the ROS interface for the service or topic. for
            example, std_msgs/msg/String.
* name - a descriptive name for the widget, as a string
* onPress
* onRelease
* prefix - prepended to the msgAttribute value before displaying
* repeatdelay
* reverse
* right - a string in the format "#px" interpreted as the number of pixels from
         the right edge of the parent element.
* screen
* service - a string defining the associated ROS service. ROS services can only be
            called on behalf of a widget.
* smalltick
* step
* suffix - appended to the msgAttribute value before displaying
* trueText - what's displayed when msgAttribute is a boolean and true
* textColor
* textColor2
* top - a string in the format "#px" interpreted as the number of pixels from
        the top of the parent element.
* topic - a string defining the associated ROS topic
* topicDirection - a string with one of "publish" or "subscribe"
* type - a string describing the widget type. must exist as an HTML DIV "id"
         attribute in the HTML page.
* useAxis
* useButton
* useGamepad
* usekey_Decrease
* usekey_down
* usekey_hotkey
* usekey_Increase
* usekey_left
* usekey_right
* useKeys
* usekey_up
* useLeft - SUPERFLUOUS - if "true" use the "left" value to position the widget and ignore the right
            value. if "false" then do the opposite.
* useROS
* useTop - SUPERFLUOUS - if "true" use the "top" value to position the widget and ignore the bottom
           value. if "false" then do the opposite.
* vertical
* w - the width of the widget as "#px"
* xScaleFactor, yScaleFactor - floating point value used with the joystick to scale
                               the x and y values.

### config

Configuration details for cameras and macros.

#### cams

#### macros

#### other stuff
