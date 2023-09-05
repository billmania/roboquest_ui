build notes and scripts

building and testing from local ros2ws folder: 
    export DOCKER_HOST=tcp://192.168.1.150:2376
    docker buildx build -t rq_ui -f Dockerfile.roboquest_ui .
    this works with a local built rq_ui, not the one from the registry
        ./src/roboquest_ui/scripts/dstart.sh rq_ui
    can use docker container kill rq_ui to restart the container

troubleshooting:
    docker container kill rq_ui
    docker container ls
    cat /opt/updater/updater.log