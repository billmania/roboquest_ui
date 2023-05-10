# RoboQuest UI design v1

## Configuration files

1. settings.json
    1. defines the display widgets
    2. defines the ROS topics
    3. defines macros
2. hardcoded_settings.json

## Required Javascript libraries

### Web application framework

[ExpressJS](https://expressjs.com/) for NodeJS

### rclnodejs

Javascript support for ROS2, to subscribe to topics, call services, use ROS logging, and publish Diagnostics.

#### Topics

1. Publishers

    * charger_enable
    * drive_joystick
    * motor_controller_max_speed
    * motor_controller_power_enable
    * servo_enable_power

2. Subscribers

    * charger_enabled_state
    * charger_power_state
    * current_battery
    * current_system
    * servo_enable_power_state
    * motor_controller_power_enable_state
    * servo_angle_0
    * servo_angle_1
    * voltage_battery

### opencv4nodejs

For capturing video frames from one or more cameras and transform them. 

### child_process

To execute the resetUsbCams script, to get the list of cameras, to get the format of a particular camera, and to provide access to a shell in a terminal window.

### tree-kill

To kill a process based on its PID.

### https

To implement HTTPS communication between the browser and the server. Requires a certificate.

### fs

Interact with the filesystem:

1. read the hardcoded_settings.json file
2. read the two HTTPS certificate files
3. read the list of subscribed ROS topics from the settings.json configuration file
4. read the settings from the settings.json configuration file
5. write the updated settings to the settings.json configuration file based on two separate requests

### Real-time two way communication

[Socket.IO](https://socket.io/) between the browser and the RoboQuest UI server.

#### Emit

1. telem
2. instanceCount
3. cmdStopButtons
4. image
5. fps
6. settings
7. makeThumbs
8. hardcoded_settings
9. cmdOut
10. removeCmdW

#### Events

1. connection
2. WCTS
3. configSettings
4. cmd
5. stopcmd
6. exit
7. hb
8. ROSCTS
9. shutROS
10. setPreset
11. setCam
12. closeOtherSockets
13. muteRobotMic
14. unmuteRobotMic
15. disconnect

## RoboQuest Javascript modules

* main.js
* canvas.js
* config.js
* help.js
* serial.js
* streamAudio.js
* widgets.js
