# Gamepad capabilities and configuration

## Version
rq_ui v29

## General

The Gamepad widget is now the most complex widget available. It
produces a variable quantity of joystick values and button presses.
Typically, it's used to command a collection of servos, for
example an arm.

A Gamepad widget can both publish values and call services. This
makes the configuration process somewhat lengthy and complex.

## Configuration options

For a gamepad to be configured, it must be connected to the
computer and then detected by the RQ UI. To ensure it's detected, press
any button on the device.

The configuration process involves selecting each button or joystick and
defining what is to be done with the action. The configuration form has
a row for each button/joystick. The buttons are listed first and then the
axes (joysticks). Each row looks like:

index service/topic type attribute-list scaling

When the associated button is activated on the gamepad, its corresponding
index number will be highlighted.

### topic or service

A gamepad can "publish" onto a topic, call a "service", or a
combination of multiples of each.

### topic

The name of the topic onto which the value(s) should be published.
For example, to command servo motion, the topic is "servos". To
enable and disable servos, the service is "control_hat".

### topic or service type

The type of ROS message to publish. For the "servos" topic, the
type is "rq_msgs/msg/Servos". For the "control_hat" service it's
"rq_msgs/srv/Control".

### topic or service attribute

Each attribute name must be terminated with a semi-colon,
even when there is no second attribute.
For example, "servo0.speed_dps;servo0.command_type:3" or
"set_servos:ON;".

### axes scaling

Each axis configured requires one floating point scaling value.

## Examples from configuration.json

### arm control
