# RoboQuest browser-based UI

The RoboQuest UI uses NodeJS, ExpressJS, and WebSocket to provide a
user interface for a ROS2-based robot.

## Run directly

```
cd ros2ws
node src/roboquest_ui/src/rq_server.js
```

## Run via npm

```
cd ros2ws/src/roboquest_ui
npm run rq_server
```

## Run via ROS2 launch

```
cd ros2ws
source install/setup.bash
ros2 launch roboquest_ui roboquest_ui.launch.py
```
