===================

Possible performance improvements if needed:
1. centrally parse json on telemetry message instead of inside each widget
2. better to allow a "style" or "css" property instead of individual props like text color?
3. toggle buttons might make sense to connect to states\
4. macro buttons?
5. button group containers
6. feedback  / status widget

=============
build process

from local ros2ws folder: 
    export DOCKER_HOST=tcp://192.168.1.150:2376
    docker buildx build -t registry.q4excellence.com:5678/rq_ui -f Dockerfile.roboquest_ui .

from robot ssh
    docker container kill rq_ui
    docker container ls