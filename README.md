# RoboQuest browser-base UI

The RoboQuest UI uses NodeJS, ExpressJS, and WebSocket to provide a
user interface for a ROS2-based robot.

## Run directly

```
cd ros2ws
node src/mypkg/src/index.js
```

## Run via npm

```
cd ros2ws/src/mypkg
npm run index
```

## Run via ROS2 launch

```
cd ros2ws
source install/setup.bash
ros2 launch mypkg mypkg.launch.py
```
