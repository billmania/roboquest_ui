'use strict';

const RobotComms = require('./robot_comms.js');
const robotComms = new RobotComms('rq_server');

robotComms.main();
