build notes and scripts

building and testing from local ros2ws folder: 
    export DOCKER_HOST=tcp://192.168.1.150:2376
    docker buildx build -t registry.q4excellence.com:5678/rq_ui -f Dockerfile.roboquest_ui .
    ./src/roboquest_ui/scripts/dstart.sh rq_ui

troubleshooting:
    docker container kill rq_ui
    docker container ls
    cat /opt/updater/updater.log