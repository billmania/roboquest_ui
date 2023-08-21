
free form positioning!
dynamic change anchor to closest corner

widgets are loaded in compass regions: N,S,E,W
they are loaded in the json array order

logic widget, in the future, be able to see the output and map to a new widget

adding a widget is done in a modal where region can be changed.
widget can be added to beginning or end of a region before DnD reorder

widget components are defined modularly in their own component files.

the entire config is loaded from a json file requested from the server.

===================

start from a persistent definition of the layout of widgets on the browser page
start with a defined menu of available widgets
provide a means to reposition the existing page widgets
provide a means to remove widgets from the page
provide a means to add widgets to the page
persist the changes to the page layout

===================

built with : https://jquery.com/
widgets are a custom plugin for the widget factory: https://jqueryui.com/widget/

every widget type requires:
    1. a widget plugin js file
    2. include the widget plugin js file in the index.html
    3. a form section to configure the widget in index.html


===================

time:
attempting the builds: 
    2 hours capped.
dev: 
    7 hours, jquery POC


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