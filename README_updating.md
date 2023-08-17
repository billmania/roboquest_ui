# Updating the RoboQuest software

## Procedure

1. connect the robot to wall power
2. enable the battery charger
3. give the robot an Internet connection
4. switch to screen 4 on the HAT UI
5. click the UPDATE button
6. watch the HAT UI until it shows "update complete"
7. reload the browser page

## Details

There are two parts to the software update process. The first part
ensures the update process itself is up to date. The second part
ensures the RoboQuest application software is up to date.

Real-time status about the update process is shown in two places.
Screen 4 of the HAT UI displays brief messages while the application
is updated. These messages are shown only during the update process.
All of the details about the update process are also recorded in
the updater's log file, found on the robot at /opt/updater/updater.log.

Depending on the throughput of the robot's Internet connection, the
time required to retrieve updated software can vary from a few minutes
to an hour. It's best to NOT interrupt the Internet connection during
the update of the application software. If that does happen, the robot
should be able to recover automatically after connectivity is restored.

If power is interrupted while the updater itself is being updated, it's
more likely the robot will require manual intervention to recover. It's
best to NOT start an update until there is confidence in the stability
of both the Internet connection and the electrical power to the robot.

## Troubleshooting

1. Is the updater.py process running
2. What's recorded in /opt/updater/updater.py
3. From the robot, is it possible to "ping" google.com
