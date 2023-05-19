console.log(
  'Host: ' +
  window.location.hostname +
  ' Port: ' +
  window.location.port);

const socket = io(window.location.hostname + ':' + window.location.port);

function connect () {
  console.log('Socket connected, ID: ' + socket.id);
};

function disconnect (reason) {
  console.log('Socket disconnected, Reason: ' + reason);
};

function heartbeat (ping_ms) {
  socket.emit('hb', ping_ms);
};

function heartbeat_received (hb_stamp) {
  console.log('heartbeat received');
  document.getElementById('heartbeat').innerHTML = hb_stamp;
};

document.getElementById('heartbeat').innerHTML = 'Waiting for first heartbeat';
socket.on('connect', connect);
socket.on('disconnect', disconnect);
socket.on('pong', heartbeat);
socket.on('hb', heartbeat_received);
