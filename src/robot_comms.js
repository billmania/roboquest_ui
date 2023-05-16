'use strict';

const rclnodejs = require('rclnodejs');

class RobotComms {
  constructor (nodeName) {
    this.nodeName = nodeName;
    this.rclnodejs = rclnodejs;

    this.setupRos();

    this.counter = 0;
  }

  setupRos () {
    this.rclnodejs.init();
    this.node = this.rclnodejs.createNode(this.nodeName);
    this.logger = this.rclnodejs.logging.getLogger(this.nodeName);
    this.logger.setLoggerLevel(this.logger.LoggingSeverity.DEBUG);

    this.publisher = this.node.createPublisher(
      'std_msgs/msg/String',
      this.nodeName + '_topic');
    this.logger.debug('Setup to publish String');
    this.subscription = this.node.createSubscription(
      'rq_msgs/msg/Telemetry',
      'telemetry',
      this.telemetryCb.bind(this));
    this.logger.debug('Setup to subscribe Telemetry');
  }

  telemetryCb (msg) {
    this.logger.debug('Received telemetry ', msg);
  }

  stringPublisher () {
    this.publisher.publish(`Here I am ${this.counter}`);
    this.counter += 1;
  }

  main () {
    // TODO: Look for a more ROS2 interval mechanism
    setInterval(this.stringPublisher.bind(this), 1000);
    this.logger.info(`${this.nodeName} started`);

    this.rclnodejs.spin(this.node);
  }
}

module.exports = RobotComms;
