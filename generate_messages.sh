#!/usr/bin/env bash

source /opt/ros/humble/setup.bash
source /usr/src/ros2ws/install/setup.bash

cd /usr/src/ros2ws/src/roboquest_ui

/usr/local/node-v18.16.0-linux-arm64/bin/npx rclnodejs-cli generate-ros-messages

exit 0
