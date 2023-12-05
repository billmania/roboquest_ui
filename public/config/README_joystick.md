# Joystick capabilities and configuration

## General

The Joystick widget is the most complex widget available. It
always produces two numerical values. Typically, it's used to
command two-dimensional robot motion. It can be used in place of
a non-servo slider, albeit not well, as well as anywhere two
values are needed within a single ROS message. Lastly, it's
possible to use a single joystick to command one or two servos.

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
For example, "twist.angular.z;twist.linear.x" or "max_rpm;".

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
{
  "id": 18,
  "type": "joystick",
  "label": "motion",
  "position": {
  "my": "left top",
  "at": "left top"
  },
  "format": {},
  "data": {
    "scale": [
      1,
      1
    ],
    "topic": "cmd_vel",
    "topicAttribute": [
      "twist.angular.z",
      "twist.linear.x"
    ],
    "topicType": "geometry_msgs/msg/TwistStamped",
    "topicDirection": "publish",
    "topicPeriodS": 5
  }
}
```

## simple slider

A joystick can be used to emulate a slider, but not well. There's
a significant difference between a slider and a joystick. When a
slider is released, its value remains where it was released. When
a joystick is released, its values returns to 0.

## servo

