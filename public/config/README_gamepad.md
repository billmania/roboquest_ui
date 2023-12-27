# Gamepad capabilities and configuration

## Version
rq_ui v29

## General

The Gamepad widget is the most complex widget available. It
produces a variable quantity of joystick values and button
presses. Typically, it's used to command a collection of servos,
for example an arm. It can also be used to control drive motors.

A Gamepad widget can both publish to topics and call services. This
makes the configuration process somewhat lengthy and complex.

## Configuration options

For a gamepad to be configured, it must be connected to the
computer and then detected by the RQ UI. To ensure it's detected, press
any button on the device. Do this before clicking the "add
widget" button.

The configuration process involves selecting each button or joystick and
defining what is to be done with the action. The configuration form has
a row for each button/joystick. The buttons are listed first and then the
axes (joysticks). Each row has input fields for: description,
destinationType, destinationName, interface, attributes, and
scaling. Each row is identified with an actionId at the beginning
of the row. Button actions use the format "b##" and Axes actions
use "a##".

To find the row for the gamepad button or axis, click the button
or move the joystick. It's actionId will be highlighted on the
configuration form.

### description

Describes the purpose or use of this action.

### destinationType

An action can use a "topic" or a "service" as the destination of
the action's value or click.

### destinationName

The name of the topic or service for this action. To control
servos, use the topic "servos". To control drive motors, use the
topic "cmd_vel". To set motors or servos OFF or ON, use the
service "control_hat".

### interface

The type of ROS message for the topic or service. For the
"servos" topic, the type is "rq_msgs/msg/Servos". For the
"control_hat" service it's "rq_msgs/srv/Control". On the
"cmd_vel" topic it's "geometry_msgs/msg/TwistStamped".

### attributes

Which message attributes to set when the action occurs. Axes
actions produce a single value, from the range [-1.0, 1.0]. When
released they produce 0. Some button actions produce a single
value, but from the range [0.0, 1.0]. The value from both kinds
of action will be assigned to the first attribute.

Most buttons produce only a "click" event and don't produce a
numerical value.

Attributes can have a constant value assigned, ignoring any value
from the action.

When there are multiple attributes for an action, separate them
with a semi-colon. When assigning a constant to an attribute,
separate it with a colon.

See the examples below.

### scaling

Each axis and each value-producing button requires one signed, floating
point scaling value. The action's value is multiplied by the
scaling before being assigned to the attribute.

### Examples

#### power control

Use a button action.

* description - Servos ON
* destinationType - service
* destinationName - control_hat
* interface - rq_msgs/srv/Control
* attributes - set_servos:ON
* scaling - LEAVE IT BLANK

#### servo control

Use an axis action or a button which produces a value (a
trigger).

* description - Arm elbow
* destinationType - topic
* destinationName - servos
* interface - rq_msgs/srv/Servos
* attributes - servo0.speed_dps;servo0.command_type:3
* scaling - 20

* description - Gripper
* destinationType - topic
* destinationName - servos
* interface - rq_msgs/msg/Servos
* attributes - servo0.angle_deg;servo0.command_type:1
* scaling - -100

#### drive control

* description - Forward
* destinationType - topic
* destinationName - cmd_vel
* interface - geometry_msgs/msg/TwistStamped
* attributes - twist.linear.x
* scaling - 300

* description - Turn
* destinationType - topic
* destinationName - cmd_vel
* interface - geometry_msgs/msg/TwistStamped
* attributes - twist.angular.z
* scaling - 200
