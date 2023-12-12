# Joystick capabilities and configuration

## Version
rq_ui v28

## General

The Joystick widget is the most complex widget available. It
always produces two numerical values. Typically, it's used to
command two-dimensional robot motion or two servos. It can be
used anywhere two values are needed within a single ROS message.

## Configuration options

### topic direction

A joystick can only "publish" onto a topic.

### topic

The name of the topic onto which the value(s) should be published.
For example, to command robot motion, the topic is "cmd_vel".

### topic type

The type of ROS message to publish. For the "cmd_vel" topic, the
type is "geometry_msgs/msg/TwistStamped".

### topic attribute

Since the joystick produces two numerical values, one or two
attributes can be specified. The joystick's numerical values are
in order with the x axis first and the y axis second. The x axis
value is assigned to the first attribute. If a second attribute
is specified, the y axis value is assigned to it.

The first attribute name must be terminated with a semi-colon,
even when there is no second attribute.
For example, "twist.angular.z;twist.linear.x" or "servo0.angle_deg;".

### axes scaling

Joystick axes values are always within the range [-100, 100]. The
two scaling values are floating point and will scale the axis
values. For example, if the attribute to which the x axis value
will be assigned requires a value in the range [-300, 300] then
set the x scaling value to 3.

Two scaling values are required and they must be separated by a
semi-colon. The default scaling is "1;1", which doesn't actually
scale.

### topic period

The joystick has the option of automatically republishing its
most recent values. If this is not required, set the period to 0.
If it's necessary to republish values, set the topic period in
seconds.

## Examples from configuration.json

### motion command

```
topic direction: publish
topic: cmd_vel
topic type: geometry_msgs/msg/TwistStamped
topic attribute: twist.angular.z;twist.linear.x
axes_scaling: 3;3
topic_period: 5
```

## servo

For servos, the scaling will work best around 0.2. Scaling which is too large will
cause the servo to move to its extreme in one update cycle.

In the following example, the joystick's x value will control the speed of servo 0.
The y value will control servo 1.

The topic period must be 0 for a joystick servo. Undesirable behavior will occur with
a non-zero period.

```
topic direction: publish
topic: servos
topic type: rq_msgs/msg/Servos
topic_attribute: servo0.speed_dps;servo1.speed_dps;servo0.command_type:3;servo1.command_type:3
axes_scaling: 0.2;0.2
topic_period: 0
```
