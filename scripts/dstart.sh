#!/usr/bin/env bash

#
# Start the docker container for roboquest_ui
#

IMAGE=$1
NAME=rq_ui
PERSIST_DIR="/usr/src/ros2ws/install/roboquest_ui/share/roboquest_ui/public/persist"

printf "Starting %s on %s\n" "$IMAGE" $DOCKER_HOST

docker run -it --rm \
        --network host \
        --ipc host \
        --env "ROS_DOMAIN_ID=72" \
        -v /dev/shm:/dev/shm \
        -v /tmp/update_fifo:/tmp/update_fifo \
        -v /opt/persist:${PERSIST_DIR} \
        -v ros_logs:/root/.ros/log \
        --name $NAME \
        $IMAGE

if [[ $? = 0 ]]
then
    docker container ls
    printf "\nStarted\n"
else
    printf "Failed to start $NAME\n"
fi

exit 0
