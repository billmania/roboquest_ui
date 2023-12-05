# Servo capabilities and configuration

## Relevant releases

### rq_core  v21
### rq_ui v28

## General

The RoboQuest hardware can support up to 16 servos. The servos
have several configuration options. They also have two separate
ways to be controlled.

## Configuration

A servo is an actuator with a limited revolute joint. Typically,
hobby-grade servos have a rotational range of 180 degrees. The
servo is commanded to achieve a specific angle position.

In order to accurately configure an individual servo, it's
necessary to first determine its limits. The first limits are
the minimum and maximum pulse length. These are typically
between 600 and 2,400 microseconds. From the servo datasheet or
experimentation find the actual quantity of microseconds which
will rotate the servo shaft to its "zero degrees" position. Then
do the same thing to find the microseconds which rotate the
servo shaft to its maximum angle.

After the pulse lengths are configured, configure the minimum
and maximum servo angle. These are the hardware limits of the
servo when it is unloaded and not connected to anything. They
correspond to the minimum and maximum pulse length, too. For
example, if the maximum pulse length were 2,350 microseconds and
moved the servo shaft only 178 degrees away from the "zero"
position, then the servo maximum angle must be set to 178.

After pulse and servo angle values are configured, set the joint
minimum and maximum angles. These depend upon the constraints of
the joint for each servo. For example, assume the servo hardware
can rotate a full 180 degrees. Next, assume the joint into which
it's installed can rotate only 100 degrees. Lastly, assume the
minimum angle the joint can achieve is at the servo's 10 degree
position and the joint's maximum angle is 110 degrees.  With
these assumptions, or actual measurements, configure the joint
minimum and maximum as 10 and 110 degrees.

Lastly, the servo has a default angle position to be set at
power up. If the joint should be moved to the servo's D degree
position by default, set the initial angle to D.

## Control

Individual servos are referenced by their channel number. They
can be commanded with either a specific angle to achieve or an
angle increment.

### Angle

There is no control over the rotational speed when commanding
the servo with an angle. The servo will be moved at its maximum
possible speed. This could be problematic, in terms of
electrical power consumption and kinetic energy, when commanding
a servo to move from its minimum angle to its maximum angle.

### Angle increment

This will be an rq_core v21 feature.

The servo can be commanded to change its current position by a
specified increment, in a specified direction. The change occurs
at maximum servo speed.

### Rotational velocity

This will be an rq_core v21 feature.

The servo can be commanded to rotate in a specific direction at
a specific speed. The direction is clockwise (from the zero
position toward the maximum position) or counter-clockwise. The
speed is in degrees per second. Motion of the servo will stop
automatically when it reaches either the minimum or maximum
joint angle.
