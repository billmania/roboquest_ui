#!/usr/bin/env bash

set -Eeu
trap cleanup SIGINT SIGTERM ERR EXIT

#
# Where to find the JavaScript source files, for both the
# server and the browser. Server files are under src and
# browser files are under public/js.
#
SOURCE_DIR="/usr/src/ros2ws/src/roboquest_ui"

#
# Location for files used by the NodeJS server.
#
SERVER_DIR="/usr/src/ros2ws/install/roboquest_ui/share/roboquest_ui/dist"

#
# Location of files used by the browser. HTML files are in this
# directory. JavaScript files are in the sub-directory js.
#
BROWSER_DIR="/usr/src/ros2ws/install/roboquest_ui/share/roboquest_ui/public"

PERSIST_DIR="${BROWSER_DIR}/persist/ui"

cleanup () {
    trap - SIGINT SIGTERM ERR EXIT
    echo "start.sh terminated by external event" >&2

    exit 1
}

#
# Ensure the directory exists and is writable.
#
# $1 - full directory path
#
make_dir () {
    if [ ! -d $1 ]
    then
        rm -f $1 2>/dev/null
        mkdir -p $1
    fi

    if [ ! -w $1 ]
    then
        chmod ug+w $1
    fi

    return 0
}

#
# True if the file exists in the directory and is readable.
#
# $1 - the full path for the file
#
file_exists () {
    if [ -f $1 ] && [ -r $1 ]
    then
        return 0
    else
        return 1
    fi
}

#
# Copies the file to the destination directory.
#
# $1 - the full path for the file
# $2 - the destination directory
#
copy_file () {
    file_name=$(basename $1)
    cp $1 $2/${file_name}

    return 0
}

#
# Modify the JavaScript source file, making it suitable for use by the browser.
#
# $1 - the full path for the file
#
browserize_file () {
    sed -i 's/module.exports =/const ros =/' $1
}

make_dir ${PERSIST_DIR}

SRC_FILE=ros_interfaces.js
if file_exists ${PERSIST_DIR}/${SRC_FILE}
then
    #
    # Overwrite the version in the container with the user-modified
    # version.
    #
    copy_file \
        ${PERSIST_DIR}/${SRC_FILE} \
        ${SERVER_DIR}

else
    #
    # Make the container version of the file available to the user.
    #
    copy_file \
        ${SERVER_DIR}/${SRC_FILE} \
        ${PERSIST_DIR}
fi

#
# The browser uses a slightly different format of SRC_FILE.
#
cp ${PERSIST_DIR}/${SRC_FILE} /tmp/${SRC_FILE}
browserize_file \
    /tmp/${SRC_FILE}
copy_file \
    /tmp/${SRC_FILE} \
    ${BROWSER_DIR}/js

SRC_FILE=widget_interface.js
if file_exists ${PERSIST_DIR}/${SRC_FILE}
then
    copy_file \
        ${PERSIST_DIR}/${SRC_FILE} \
        ${BROWSER_DIR}/js
else
    copy_file \
        ${BROWSER_DIR}/js/${SRC_FILE} \
        ${PERSIST_DIR}
fi

set +Eeu

cd /usr/src/ros2ws
source /opt/ros/humble/setup.bash
source install/setup.bash

ros2 launch roboquest_ui roboquest_ui.launch.py
