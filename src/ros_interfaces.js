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
      max_rpm: 0
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
      }
    },

    'rq_msgs/msg/Telemetry': {
      header: {
        stamp: {
          sec: 0,
          nanosec: 0
        },
        frame_id: ''
      },
      battery_v: 0.0,
      battery_ma: 0.0,
      system_ma: 0.0,
      adc0_v: 0.0,
      adc1_v: 0.0,
      adc2_v: 0.0,
      adc3_v: 0.0,
      adc4_v: 0.0,
      charger_has_power: false,
      battery_charging: false,
      motors_on: false,
      servos_on: false
    },

    'rq_msgs/srv/Control': {
      set_charger: '',
      set_fet1: '',
      set_fet2: '',
      set_motors: '',
      set_servos: ''
    },

    'std_srvs/srv/Empty': {
    }
  },

  /**
   * For each interface name, the list of attributes which the User Interface
   * can publish, subscribe, or request.
   */
  attributesLists: { // eslint-disable-line no-unused-vars
    'rq_msgs/srv/Control': [
      'set_charger',
      'set_fet1',
      'set_fet2',
      'set_motors',
      'set_servos'
    ],

    'rq_msgs/msg/MotorSpeed': [
      'max_rpm'
    ],

    'rq_msgs/msg/Servos': [
      'servo0.angle_deg', 'servo0.angle_incr_deg', 'servo0.speed_dps', 'servo0.command_type',
      'servo1.angle_deg', 'servo1.angle_incr_deg', 'servo1.speed_dps', 'servo1.command_type',
      'servo2.angle_deg', 'servo2.angle_incr_deg', 'servo2.speed_dps', 'servo2.command_type',
      'servo3.angle_deg', 'servo3.angle_incr_deg', 'servo3.speed_dps', 'servo3.command_type',
      'servo4.angle_deg', 'servo4.angle_incr_deg', 'servo4.speed_dps', 'servo4.command_type',
      'servo5.angle_deg', 'servo5.angle_incr_deg', 'servo5.speed_dps', 'servo5.command_type',
      'servo6.angle_deg', 'servo6.angle_incr_deg', 'servo6.speed_dps', 'servo6.command_type',
      'servo7.angle_deg', 'servo7.angle_incr_deg', 'servo7.speed_dps', 'servo7.command_type',
      'servo8.angle_deg', 'servo8.angle_incr_deg', 'servo8.speed_dps', 'servo8.command_type',
      'servo9.angle_deg', 'servo9.angle_incr_deg', 'servo9.speed_dps', 'servo9.command_type',
      'servo10.angle_deg', 'servo10.angle_incr_deg', 'servo10.speed_dps', 'servo10.command_type',
      'servo11.angle_deg', 'servo11.angle_incr_deg', 'servo11.speed_dps', 'servo11.command_type',
      'servo12.angle_deg', 'servo12.angle_incr_deg', 'servo12.speed_dps', 'servo12.command_type',
      'servo13.angle_deg', 'servo13.angle_incr_deg', 'servo13.speed_dps', 'servo13.command_type',
      'servo14.angle_deg', 'servo14.angle_incr_deg', 'servo14.speed_dps', 'servo14.command_type',
      'servo15.angle_deg', 'servo15.angle_incr_deg', 'servo15.speed_dps', 'servo15.command_type'
    ],

    'rq_msgs/msg/Telemetry': [
      'adc0_v', 'adc1_v', 'adc2_v', 'adc3_v', 'adc4_v', 'battery_charging', 'battery_ma',
      'battery_v', 'charger_has_power', 'motors_on', 'servos_on', 'system_ma'
    ],

    'geometry_msgs/msg/TwistStamped': [
      'twist.angular.z', 'twist.linear.x'
    ],

    'std_srvs/srv/Empty': [
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
    restart: 'std_srvs/srv/Empty',
    servos: 'rq_msgs/msg/Servos',
    telemetry: 'rq_msgs/msg/Telemetry'
  },

  /**
   * A map to allow using the destinationType value as an index to the list
   * of options for each destinationType.
   */
  destinationMap: {
    topic: [
      'cmd_vel',
      'motor_speed',
      'servos',
      'telemetry'
    ],

    service: [
      'control_hat',
      'restart'
    ]
  },

  /**
   * Perform some rudimentary consistency checks on the maps.
   */
  checkMaps: function () {
    try {
      console.debug(this.destinationMap)

      for (const destinationType in this.destinationMap) {
        console.debug(`destinationType: ${destinationType}`)
        console.debug(` this.destinationMap[destinationType] is ${typeof this.destinationMap[destinationType]}`)
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
  }
}
