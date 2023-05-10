const rclnodejs = require('rclnodejs')

function telemetryCb (msg) {
  console.log(`Received telemetry ${typeof msg}`, msg)
};

function diagnosticsCb (msg) {
  console.log(`Received diagnostics ${typeof msg}`, msg)
  console.log(` values`, msg.status[0].values)
};

async function rqServer () {
  await rclnodejs.init()
  const node = rclnodejs.createNode('rq_server')

  node.createSubscription('rq_msgs/msg/Telemetry',
    'telemetry',
    telemetryCb)

  node.createSubscription('diagnostic_msgs/msg/DiagnosticArray',
    'diagnostics',
    diagnosticsCb)

  console.log('Started')
  node.spin()
}

(async function main () {
  rqServer()
}()).catch(() => {
  process.exitCode = 1
})
