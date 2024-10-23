'use strict'

/*
 * The widget_interface object is used similarly to the objects in src/ros_interfaces.js.
 * It defines the allowed service, topic, and attributes allowed for each widget
 * type.
 * Widgets are more constrained than the gamepad. There aren't any widgets which have
 * the option of either a topic or a service.
 *
 * The widgetInterface contains a property for each member of WIDGET_TYPES,
 * exluding 'gamepad'. The value for each property is an object with one of
 * the following structures:
 *
 * 'service': {
 *   serviceName: {                  // service
 *     interfaceName: [              // serviceType
 *       attribute1,                 // serviceAttribute
 *       attribute2,
 *       attributeN
 *     ]
 *   }
 * }
 *
 * 'topic': {
 *   'publish'|'subscribe': {        // topicDirection
 *     topicName: {                  // topic
 *       interfaceName: [            // topicType
 *         attribute1,               // topicAttribute
 *         attribute2,
 *         attributeN
 *       ]
 *     },
 *     topicName: {
 *       interfaceName: [
 *         attribute1,
 *         attribute2,
 *         attributeN
 *       ]
 *     }
 *   }
 * }
 *
 */
const widgetInterface = { // eslint-disable-line no-unused-vars
  button: {
    // can only call services
    service: {
      control_hat: {
        'rq_msgs/srv/Control': [
          'set_motors',
          'set_servos',
          'set_fet1',
          'set_fet2',
          'set_charger'
        ]
      }
    }
  },

  slider: {
    // can only publish to topics and only one at a time
    topic: {
      publish: {
        motor_speed: {
          'rq_msgs/msg/MotorSpeed': [
            'max_rpm'
          ]
        },

        servos: {
          'rq_msgs/msg/Servos': [
            'servo0.angle_deg;servo0.command_type:1',
            'servo1.angle_deg;servo1.command_type:1',
            'servo2.angle_deg;servo2.command_type:1',
            'servo3.angle_deg;servo3.command_type:1',
            'servo4.angle_deg;servo4.command_type:1',
            'servo5.angle_deg;servo5.command_type:1',
            'servo6.angle_deg;servo6.command_type:1',
            'servo7.angle_deg;servo7.command_type:1',
            'servo8.angle_deg;servo8.command_type:1',
            'servo9.angle_deg;servo9.command_type:1',
            'servo10.angle_deg;servo10.command_type:1',
            'servo11.angle_deg;servo11.command_type:1',
            'servo12.angle_deg;servo12.command_type:1',
            'servo13.angle_deg;servo13.command_type:1',
            'servo14.angle_deg;servo14.command_type:1',
            'servo15.angle_deg;servo15.command_type:1'
          ]
        }
      }
    }
  },

  value: {
    // can only subscribe to topics and only one at a time
    topic: {
      subscribe: {
        telemetry: {
          // attribute values must be numeric
          'rq_msgs/msg/Telemetry': [
            'battery_v',
            'battery_ma',
            'system_ma',
            'adc0_v',
            'adc1_v',
            'adc2_v',
            'adc3_v',
            'adc4_v'
          ]
        }
      }
    }
  },

  indicator: {
    // can only subscribe to topics and only one at a time
    topic: {
      subscribe: {
        telemetry: {
          // attribute values must be boolean
          'rq_msgs/msg/Telemetry': [
            'charger_has_power',
            'battery_charging',
            'motors_on',
            'servos_on'
          ]
        }
      }
    }
  },

  joystick: {
    // can only publish to topics and only one at a time.
    // the widget produces two values from -1.0 to 1.0 and
    //  the horizontal value will be assigned to the first attribute
    //  and the vertical to the second.
    topic: {
      publish: {
        servos: {
          'rq_msgs/msg/Servos': [
            'servo0.speed_dps',
            'servo0.command_type:3',
            'servo1.speed_dps',
            'servo1.command_type:3',
            'servo2.speed_dps',
            'servo2.command_type:3',
            'servo3.speed_dps',
            'servo3.command_type:3',
            'servo4.speed_dps',
            'servo4.command_type:3',
            'servo5.speed_dps',
            'servo5.command_type:3',
            'servo6.speed_dps',
            'servo6.command_type:3',
            'servo7.speed_dps',
            'servo7.command_type:3',
            'servo8.speed_dps',
            'servo8.command_type:3',
            'servo9.speed_dps',
            'servo9.command_type:3',
            'servo10.speed_dps',
            'servo10.command_type:3',
            'servo11.speed_dps',
            'servo11.command_type:3',
            'servo12.speed_dps',
            'servo12.command_type:3',
            'servo13.speed_dps',
            'servo13.command_type:3',
            'servo14.speed_dps',
            'servo14.command_type:3',
            'servo15.speed_dps',
            'servo15.command_type:3'
          ]
        },

        cmd_vel: {
          'geometry_msgs/msg/TwistStamped': [
            'twist.angular.z;twist.linear.x'
          ]
        }
      }
    }
  }
}
