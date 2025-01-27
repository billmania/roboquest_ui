'use strict'

/**
 * Lists of ROS topics and services, with their respective interfaces.
 * Definitions of ROS interfaces.
 *
 * Start by using destinationMap to lookup the destinationName options
 * for the destinationType. Next, use the destinationName option to find
 * the interface. Lastly, use the interface to find the attributesList and
 * interfaceObject.
 *
 * For example,
 *
 * destinationNames = destinationMap[<destinationType>]
 * interfaceName = interfacesMap[<destinationName>]
 * attributes = attributesLists[<interfaceName>]
 * object = interfaceObjects[<interfaceName>]
 */

/**
 * An object where each of its attributes is the full name of a
 * ROS interface and the value of that attribute is the corresponding
 * Javascript object for that interface.
 *
 * New instances of these objects are NOT created each time they're
 * referenced.
 */
module.exports = {
  interfaceObjects: { // eslint-disable-line no-unused-vars
    'geometry_msgs/msg/TwistStamped': {
      header: {
        stamp: {
          sec: 0,
          nanosec: 0
        },
        frame_id: ''
      },
      twist: {
        linear: {
          x: 0.0,
          y: 0.0,
          z: 0.0
        },
        angular: {
          x: 0.0,
          y: 0.0,
          z: 0.0
        }
      },
      reset: function () {
        this.header.stamp.sec = 0
        this.header.stamp.nanosec = 0
        this.header.frame_id = ''

        this.twist.linear.x = 0.0
        this.twist.linear.y = 0.0
        this.twist.linear.z = 0.0
        this.twist.angular.x = 0.0
        this.twist.angular.y = 0.0
        this.twist.angular.z = 0.0
      }
    },

    'rq_msgs/msg/MotorSpeed': {
      header: {
        stamp: {
          sec: 0,
          nanosec: 0
        },
        frame_id: ''
      },
      max_rpm: 0,
      reset: function () {
        this.header.stamp.sec = 0
        this.header.stamp.nanosec = 0
        this.header.frame_id = ''

        this.max_rpm = 0
      }
    },

    'rq_msgs/msg/Servos': {
      header: {
        stamp: {
          sec: 0,
          nanosec: 0
        },
        frame_id: ''
      },
      servo0: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo1: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo2: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo3: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo4: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo5: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo6: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo7: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo8: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo9: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo10: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo11: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo12: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo13: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo14: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      servo15: {
        angle_deg: 0,
        angle_incr_deg: 0,
        speed_dps: 0,
        command_type: 0
      },
      reset: function () {
        this.header.stamp.sec = 0
        this.header.stamp.nanosec = 0
        this.header.frame_id = ''

        this.servo0.angle_deg = 0
        this.servo0.angle_incr_deg = 0
        this.servo0.speed_dps = 0
        this.servo0.command_type = 0
        this.servo1.angle_deg = 0
        this.servo1.angle_incr_deg = 0
        this.servo1.speed_dps = 0
        this.servo1.command_type = 0
        this.servo2.angle_deg = 0
        this.servo2.angle_incr_deg = 0
        this.servo2.speed_dps = 0
        this.servo2.command_type = 0
        this.servo3.angle_deg = 0
        this.servo3.angle_incr_deg = 0
        this.servo3.speed_dps = 0
        this.servo3.command_type = 0
        this.servo4.angle_deg = 0
        this.servo4.angle_incr_deg = 0
        this.servo0.speed_dps = 0
        this.servo4.command_type = 0
        this.servo5.angle_deg = 0
        this.servo5.angle_incr_deg = 0
        this.servo5.speed_dps = 0
        this.servo5.command_type = 0
        this.servo6.angle_deg = 0
        this.servo6.angle_incr_deg = 0
        this.servo6.speed_dps = 0
        this.servo6.command_type = 0
        this.servo7.angle_deg = 0
        this.servo7.angle_incr_deg = 0
        this.servo7.speed_dps = 0
        this.servo7.command_type = 0
        this.servo8.angle_deg = 0
        this.servo8.angle_incr_deg = 0
        this.servo8.speed_dps = 0
        this.servo8.command_type = 0
        this.servo9.angle_deg = 0
        this.servo9.angle_incr_deg = 0
        this.servo9.speed_dps = 0
        this.servo9.command_type = 0
        this.servo10.angle_deg = 0
        this.servo10.angle_incr_deg = 0
        this.servo10.speed_dps = 0
        this.servo10.command_type = 0
        this.servo11.angle_deg = 0
        this.servo11.angle_incr_deg = 0
        this.servo11.speed_dps = 0
        this.servo11.command_type = 0
        this.servo12.angle_deg = 0
        this.servo12.angle_incr_deg = 0
        this.servo12.speed_dps = 0
        this.servo12.command_type = 0
        this.servo13.angle_deg = 0
        this.servo13.angle_incr_deg = 0
        this.servo13.speed_dps = 0
        this.servo13.command_type = 0
        this.servo14.angle_deg = 0
        this.servo14.angle_incr_deg = 0
        this.servo14.speed_dps = 0
        this.servo14.command_type = 0
        this.servo15.angle_deg = 0
        this.servo15.angle_incr_deg = 0
        this.servo15.speed_dps = 0
        this.servo15.command_type = 0
      }

    },

    'rq_msgs/srv/Control': {
      set_charger: '',
      set_fet1: '',
      set_fet2: '',
      set_motors: '',
      set_servos: '',
      reset: function () {
        this.set_charger = ''
        this.set_fet1 = ''
        this.set_fet2 = ''
        this.set_motors = ''
        this.set_servos = ''
      }
    }
  },

  /**
   * For each interface name, the list of attributes which the User Interface
   * can publish, subscribe, or request.
   */
  attributesLists: { // eslint-disable-line no-unused-vars
    'rq_msgs/srv/Control': [
      'set_charger:OFF',
      'set_fet1:OFF',
      'set_fet2:OFF',
      'set_motors:OFF',
      'set_servos:OFF'
    ],

    'rq_msgs/msg/MotorSpeed': [
      'max_rpm:0'
    ],

    'rq_msgs/msg/Servos': [
      'servo0.angle_deg:0;servo0.command_type:1',
      'servo0.angle_incr_deg:0;servo0.command_type:2',
      'servo0.speed_dps:0;servo0.command_type:3',

      'servo1.angle_deg:0;servo1.command_type:1',
      'servo1.angle_incr_deg:0;servo1.command_type:2',
      'servo1.speed_dps:0;servo1.command_type:3',

      'servo2.angle_deg:0;servo2.command_type:1',
      'servo2.angle_incr_deg:0;servo2.command_type:2',
      'servo2.speed_dps:0;servo2.command_type:3',

      'servo3.angle_deg:0;servo3.command_type:1',
      'servo3.angle_incr_deg:0;servo3.command_type:2',
      'servo3.speed_dps:0;servo3.command_type:3',

      'servo4.angle_deg:0;servo4.command_type:1',
      'servo4.angle_incr_deg:0;servo4.command_type:2',
      'servo4.speed_dps:0;servo4.command_type:3',

      'servo5.angle_deg:0;servo5.command_type:1',
      'servo5.angle_incr_deg:0;servo5.command_type:2',
      'servo5.speed_dps:0;servo5.command_type:3',

      'servo6.angle_deg:0;servo6.command_type:1',
      'servo6.angle_incr_deg:0;servo6.command_type:2',
      'servo6.speed_dps:0;servo6.command_type:3',

      'servo7.angle_deg:0;servo7.command_type:1',
      'servo7.angle_incr_deg:0;servo7.command_type:2',
      'servo7.speed_dps:0;servo7.command_type:3',

      'servo8.angle_deg:0;servo8.command_type:1',
      'servo8.angle_incr_deg:0;servo8.command_type:2',
      'servo8.speed_dps:0;servo8.command_type:3',

      'servo9.angle_deg:0;servo9.command_type:1',
      'servo9.angle_incr_deg:0;servo9.command_type:2',
      'servo9.speed_dps:0;servo9.command_type:3',

      'servo10.angle_deg:0;servo10.command_type:1',
      'servo10.angle_incr_deg:10;servo0.command_type:2',
      'servo10.speed_dps:0;servo10.command_type:3',

      'servo11.angle_deg:0;servo11.command_type:1',
      'servo11.angle_incr_deg:11;servo0.command_type:2',
      'servo11.speed_dps:0;servo11.command_type:3',

      'servo12.angle_deg:0;servo12.command_type:1',
      'servo12.angle_incr_deg:12;servo0.command_type:2',
      'servo12.speed_dps:0;servo12.command_type:3',

      'servo13.angle_deg:0;servo13.command_type:1',
      'servo13.angle_incr_deg:13;servo0.command_type:2',
      'servo13.speed_dps:0;servo13.command_type:3',

      'servo14.angle_deg:0;servo14.command_type:1',
      'servo14.angle_incr_deg:14;servo0.command_type:2',
      'servo14.speed_dps:0;servo14.command_type:3',

      'servo15.angle_deg:0;servo15.command_type:1',
      'servo15.angle_incr_deg:15;servo0.command_type:2',
      'servo15.speed_dps:0;servo15.command_type:3'
    ],

    'geometry_msgs/msg/TwistStamped': [
      'twist.angular.z:0.0', 'twist.linear.x:0.0'
    ]
  },

  /**
   * A map from a topic or service name to the name of its interface. This map
   * prohibits topics and services from having the same name.
   */
  interfacesMap: { // eslint-disable-line no-unused-vars
    cmd_vel: 'geometry_msgs/msg/TwistStamped',
    control_hat: 'rq_msgs/srv/Control',
    motor_speed: 'rq_msgs/msg/MotorSpeed',
    servos: 'rq_msgs/msg/Servos'
  },

  /**
   * A map to allow using the destinationType value as an index to the list
   * of destinationNames for each destinationType.
   */
  destinationMap: {
    topic: [
      'cmd_vel',
      'motor_speed',
      'servos'
    ],

    service: [
      'control_hat'
    ]
  },

  /**
   * Perform some rudimentary consistency checks on the maps.
   */
  checkMaps: function () {
    try {
      for (const destinationType in this.destinationMap) {
        console.debug(`destinationType: ${destinationType}`)
        for (const destinationName of this.destinationMap[destinationType]) {
          console.debug(`  ${destinationName}`)
          const interfaceName = this.interfacesMap[destinationName]
          console.debug(`    ${interfaceName}`)
          console.debug(`      attributes: ${this.attributesLists[interfaceName]}`)
          console.debug(`      object: ${JSON.stringify(this.interfaceObjects[interfaceName])}`)
        }
      }
    } catch (error) {
      throw new Error(`checkMaps: ${error.name}, ${error.message}`)
    }

    return true
  },

  /**
   * Get current wall time as a ROS header.stamp object.
   *
   * @returns {object}
   */
  getRosTimestamp: function () {
    const timestamp = Date.now()

    return {
      sec: Math.trunc(timestamp / 1000),
      nanosec: Math.trunc(timestamp / 1000 % 1 * 1000000000)
    }
  }
}
