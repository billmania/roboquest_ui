#!/usr/bin/env bash

set -x

ARCH=$1
VERSION=$2

source /opt/ros/humble/setup.bash
source /usr/src/ros2ws/install/setup.bash

cd /usr/src/ros2ws/src/roboquest_ui

/usr/local/node-v${VERSION}-linux-${ARCH}/bin/npx rclnodejs-cli generate-ros-messages

exit 0
