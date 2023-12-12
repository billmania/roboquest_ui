# Slider capabilities and configuration

## Version

rq_ui v28

## General

The Slider widget always produces one numerical value. Typically,
it's used to position an actuator (like a servo) or to set a
value (like a speed limit).

## Configuration options

### topic direction

A slider can only "publish" onto a topic.

### topic

The name of the topic onto which the value should be published.
For example, to command a servo, the topic is "servos".

### topic type

The type of ROS message to publish. For the "servos" topic, the
type is "rq_msgs/msg/Servos".

### topic attribute

Since the slider produces one numerical value, one attribute can
be specified. The slider's numerical value is assigned to the
first attribute. Any additional attributes must include constant
values.

## Examples from configuration.json

### value set

```
topic direction: publish
topic: motor_speed
topic type: rq_msgs/msg/MotorSpeed
topic attribute: max_rpm
```

### servo command

```
topic direction: publish
topic: servos
topic type: rq_msgs/msg/Servos
topic attribute: servo0.angle_deg;servo0.command_type:1
```
