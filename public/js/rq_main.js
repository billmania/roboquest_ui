/**
 * RQUI manages the appearance of the UI on the browser page, updating
 * it with messages from the backend server and sending commands to
 * the backend.
 */
'use strict'

class RQUI {
  /**
   * Setup the class.
   */
  constructor () {
    this.socket = new RQSocket(
      this.connect_cb.bind(this),
      this.disconnect_cb.bind(this))
    this.robotConnected = false
    this.messageMask = document.getElementById('mask')

    this.buildBasePage()
    this.setupSocketEvents()
    console.log('RQUI instantiated')
  }

  /**
   * Define the initial contents of the DOM and associate callback
   * functions where provided.
   */
  buildBasePage () {
    // TODO: Implement
    console.log('buildBasePage')
  }

  /**
   * Define how to process incoming socket events.
   */
  setupSocketEvents () {
    // TODO: Implement
    this.socket.add_event('hb', this.heartbeat_cb.bind(this))
    console.log('setupSocketEvents')
  }

  /**
   * Receive the heartbeat event from the server and update
   * the UI.
   *
   * @param payload {int} - the millisecond timestamp of the heartbeat.
   */
  heartbeat_cb (payload) {
    console.log(`hb event received: ${payload}`)
  }

  /**
   * Responds when the socket connection is established.
   */
  connect_cb () {
    this.robotConnected = true
    this.show_message('Connected to the robot', false)
  }

  /**
   * Responds when the socket connection is lost.
   */
  disconnect_cb () {
    this.robotConnected = false
    this.show_message('Robot disconnected', false)
  }

  /**
   * Send a heartbeat to the robot.
   *
   */
  send_heartbeat () {
    if (this.robotConnected) {
      this.socket.send_event('hb', Date.now().toString())
    } else {
      console.log('Heartbeat not sent because robot not connected')
    }
  }

  /**
   * Control visibility of the message widget and set its text.
   *
   * @param text {string} - The message to display.
   * @param showProgressBar {boolean} - Whether to include the progress bar.
   *
   */
  show_message (text, showProgressBar) {
		this.messageMask.style.display = 'inline'
		document.getElementById('messagePanel').style.display = 'flex'
		document.getElementById('messagePanelText').innerHTML = text

		if (showProgressBar) {
			document.getElementById('restartToCockpit').style.display = 'unset'
			document.getElementById('progress_bar').style.display = 'flex'
			document.getElementById('progress_bar_measure').style.width = '1%'
			setTimeout(() => {
				document.getElementById('progress_bar_measure').style.width = '100%'
			}, 5);
		}
	}

  /**
   * Remove visibility of the message widget.
   *
   */
  hide_message () {
    this.messageMask.style.display = 'none'

    document.getElementById('restartToCockpit').style.display = 'none'
    document.getElementById('messagePanel').style.display = 'none'
    document.getElementById('progress_bar_measure').style.width = '1%'
  }
} //RQUI

const rqUI = new RQUI()
setInterval(rqUI.send_heartbeat.bind(rqUI), 10000)

/**
 *
 * TODO:
 *
//a semi-transparent div overlay used in showing the user messages
var mask = document.getElementById('mask');

//divs for config window and terminal window
var configWindow = document.getElementById('configWindow');
var terminal = document.getElementById('terminal');

//states for open windows
var configIsOpen = false,
  elementOpenInConfig,
  terminalIsOpen = false,
  widgetHolderOpen = true;

//the ID and index of the widget that has it's config window open
var currentID,
  currentIndex;

//containers for the server-sent settings.json
var widgetArray = [],
  configSettings;

var snapWidgets = false;

//flags to check if elements have been constructed from json sent from server
var loadedElements = false,
  madeThumbs = false;

//all gamepad related variables
var readGamepadInterval,
  currentGamepad,
  oldGamepad,
  lastChangedAxis,
  gamepadCount = 0;

//all keyboard related variables
var keys = {},
  oldKeys = {};


//to add a sound to the audio widget, simply add the audio file to the server directory, and add the name of the file in here. Nothing else has to be done.
let sounds = [
  'bells.mp3',
  'warning.mp3',
  'message.mp3',
  'info.mp3',
  'xylo.mp3'
];

//width of the thumbnail element
const THUMBWIDTH = 150;

//video stream
let mainImage = document.getElementById('mainImage');

//the last width of the videostream image, used to reposition the video thumbnails
var lastwidth = 0;

var connected = false;

//are we on a touchscreen?
function isMobile(){
  return 'ontouchend' in document;
}

function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

//delete all resolution options for the thumbnails and recreate them from the configSettings
function refreshSelectPresets(){
  let selects = document.getElementsByClassName('cam_presets');
  for(let i = 0; i < selects.length; i++){
    let g = selects[i].value || 0;
    selects[i].innerHTML = '';
    for(let k = 0; k < configSettings.cams.presets.length; k++){
      selects[i].innerHTML += '<option value="'+k+'">'+configSettings.cams.presets[k].name+'</option>';
    }
    if(g < configSettings.cams.presets.length) selects[i].value = g;
    else selects[i].value = 0;
  }
}

//creates the html button for a macro with name and cmd to be run
function addMacro(name,cmd){
  if(name != undefined && name && cmd != undefined && cmd){
    let html = '<button class="macroButton"onmouseup="runMacro(\''+cmd+'\')">'+name+'</button>';
    document.getElementById('macroHolder').insertAdjacentHTML('beforeend', html);
  }
}
function runMacro(cmd){
  console.log('macro '+cmd);
  document.getElementById('cmdValue').value = cmd;
  runCmdFromInput();
}

//====== INITIALIZE ALL ELEMENTS IN THE WIDGET PANEL

var canvas = document.getElementById('_joystick').querySelector('#canvas_ap');
initJoystick(canvas, true);
drawJoystick(canvas,0,0);

canvas = document.getElementById('_gauge').querySelector('#gauge_ap');
drawGauge(canvas,0);

canvas = document.getElementById('_arm').querySelector('#arm_ap');
drawArm(canvas);

//initalize javascript for all source elements:
var tempList = document.getElementsByClassName('source');
for (let a of tempList) {
  sourceElement(a);
}

//initalize javascript for all dragable source elements:
initWidgetElements();

function initWidgetElements(){
  let tempList = document.getElementsByClassName('dragable');
  for (let a of tempList) {
    dragElement(a);
  }
}


//WIDGET MOUSEOVER INTERACTION
//change the z index of the widgets to allow editing
function mouseEnterWidget(ele){
  ele.style.zIndex = 100;
  let WA = widgetArray[indexMap[ele.id]];
  if(WA?.type == '_panel'){
     ele.style.zIndex = 6;
  }
  else if(WA?.type == '_rosImage'){
    setImageWidgetOnMouseInteraction(true,ele,WA);
  }
}
function mouseLeaveWidget(ele){
  ele.style.zIndex = 6;
  let WA = widgetArray[indexMap[ele.id]];
  if(WA?.type == '_rosImage'){
    setImageWidgetOnMouseInteraction(false,ele,WA);
  }
}

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var pos1S = 0, pos2S = 0, pos3S = 0, pos4S = 0;
  let WA;
  //use header as draggable hold if it exists, otherwise just use the whole div
  if (elmnt.querySelector("#header")) elmnt.querySelector("#header").onmousedown = dragMouseDown;
  if (elmnt.querySelector("#resize")) elmnt.querySelector("#resize").onmousedown = scaleMouseDown;
  // elmnt.onmousedown = dragMouseDown;
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    this.editingWidgets = true;
    WA = widgetArray[indexMap[elmnt.id]];

  if(!WA.fullscreen){
    get4position(elmnt);
    useSide(elmnt,true,true);
    set4style(elmnt);

    document.onmouseup = closeDragElement;
    //if your draging an image widget and it's in fullscreen
    document.onmousemove = elementDrag;
  }
  }
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;

    if(elmnt.offsetTop - pos2 < 50) elmnt.style.top = '50px';
    else elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

  if(WA.childids) for(let i = 0; i < WA.childids.length; i++){
    let c = document.getElementById(WA.childids[i]);
    get4position(c);
    useSide(c,true,true);
    set4style(c);
    c.style.left = (parseInt(c.style.left) - pos1) + 'px';
    c.style.top = (parseInt(c.style.top) - pos2) + 'px';
  }

  pos3 = e.clientX;
    pos4 = e.clientY;
  }
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    this.editingWidgets = false;
    if(parseInt(elmnt.style.left,10) < 245 && widgetHolderOpen){
      if(!WA?.fullscreen) removeWidgetFromScreen(elmnt);
    }
    else{
    elmnt.style.left = snapX(parseInt(elmnt.style.left)) + 'px';
    elmnt.style.top = snapY(parseInt(elmnt.style.top)) + 'px';

    if(WA.childids) for(let i = 0; i < WA.childids.length; i++){
      let c = document.getElementById(WA.childids[i]);
      c.style.left = snapX(parseInt(c.style.left) - pos1) + 'px';
      c.style.top = snapY(parseInt(c.style.top) - pos2) + 'px';
    }

    moveWidget({id:elmnt.id,x:elmnt.style.left,y:elmnt.style.top});
    get4position(elmnt);
    useClosest(elmnt);
    set4style(elmnt);
    updatePanels(elmnt);
    }
    sendWidgetsArray();
  }

  function scaleMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    WA = widgetArray[indexMap[elmnt.id]];
    pos3S = e.clientX-parseInt(elmnt.style.width);
    pos4S = e.clientY-parseInt(elmnt.style.height);

  if(!WA.fullscreen){
    get4position(elmnt);
    useSide(elmnt,true,true);
    set4style(elmnt);

    document.onmouseup = closeScaleElement;
    document.onmousemove = elementScale;
   }
  }
  function elementScale(e) {
    e = e || window.event;
    e.preventDefault();
    pos1S = pos3S - e.clientX;
    pos2S = pos4S - e.clientY;


    let minWidth = 76,
      minHeight = 61;

  if(WA.type == '_trigger'){
    minWidth = 30,
      minHeight = 30;
  }
    
    if(pos1S > -minWidth) pos1S = -minWidth;
    if(pos2S > -minHeight) pos2S = -minHeight;

    let newHeight = snapY(-pos2S) + "px";
    let newWidth = snapX(-pos1S) + "px";

    if(elmnt.querySelector('#canvas_ap')){
      var canvas = elmnt.querySelector('#canvas_ap');
      canvas.height = -pos2S-20;
      canvas.width = -pos1S;
      canvas.dispatchEvent(redrawEvent);
    }else if(elmnt.querySelector('#gauge_ap')){
      var canvas = elmnt.querySelector('#gauge_ap');
      canvas.height = -pos2S-20;
      canvas.width = -pos1S;
      drawGauge(canvas);
    }
  else if(elmnt.querySelector('#arm_ap')){
      var canvas = elmnt.querySelector('#arm_ap');
      canvas.height = -pos2S-20;
      canvas.width = -pos1S;
      drawArm(canvas,WA.arms);
    }
    else if(elmnt.querySelector('#slider_ap')){
      var slider = elmnt.querySelector('#slider_ap');
      if(slider.className.includes('vertical')){
      slider.style.width = (-pos2S-27) + 'px';
      newWidth = '35px';
    }
    else{
      newHeight = '49px';
    }
    }
    else if(elmnt.querySelector('.fsImage')){
      var eleclass = elmnt.querySelectorAll('.fsImage');
      for(let i = 0; i < eleclass.length; i++){
    if(-pos2S-20 > -pos1S){
      eleclass[i].style.width = '100%';
      eleclass[i].style.height = '';
    }else{
      eleclass[i].style.height = 'calc(100% - 20px)';
      eleclass[i].style.width = '';
    }
    }
    }
  else if(elmnt.querySelector('.dropdown_widget')){
      newHeight = '49px';
    }

    elmnt.style.height = newHeight;
    elmnt.style.width = newWidth;
  }
  function closeScaleElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    resizeWidget({id:elmnt.id,x:elmnt.style.width,y:elmnt.style.height});
    get4position(elmnt);
  useClosest(elmnt);
  set4style(elmnt);
  updatePanels(elmnt);
  sendWidgetsArray();
  }
}
//
//turn element into source:
//the _type convention is used to determime
//what dragable item to createlet WA = widgetArray[indexMap[elmnt.id]];
function sourceElement(elmnt) {
  var newElement;
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  //use header as draggable hold if it exists, otherwise just use the whole div
  //if (elmnt.querySelector("#header")) elmnt.querySelector("#header").onmousedown = dragMouseDown;
  //else elmnt.onmousedown = dragMouseDown;
  elmnt.onmousedown = dragMouseDown;
  function dragMouseDown(e) {
    newElement = widgetFromId(elmnt.id);
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    var scroll = document.getElementById('widgetHolder').scrollTop;
    newElement.style.top = (elmnt.offsetTop-scroll-pos2+50) + "px";
    newElement.style.left = (elmnt.offsetLeft - pos1) + "px";
    this.editingWidgets = true;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    if(newElement.offsetTop - pos2 < 50) newElement.style.top = '50px';
    else newElement.style.top = (newElement.offsetTop - pos2) + "px";
    newElement.style.left = (newElement.offsetLeft - pos1) + "px";
  }
  function closeDragElement(e) {
    //delete element if it's over the widget bar
    document.onmouseup = null;
    document.onmousemove = null;
    if(parseInt(newElement.style.left,10) < 245 && widgetHolderOpen){
    newElement.remove();
    this.editingWidgets = false;
  }
    else{
      //generate json, and give widget id
      //it should be noted that elmnt.id is the type, the actual id is assigned by makeUnique()
      addWidget(makeUnique(elmnt.id,newElement));
      this.editingWidgets = false;
      newElement.style.left = snapX(parseInt(newElement.style.left)) + 'px';
      newElement.style.top = snapY(parseInt(newElement.style.top)) + 'px';
      get4position(newElement);
      useClosest(newElement);
      set4style(newElement);

      updatePanels(newElement);
    }
    sendWidgetsArray();
  }
}
//returns closest grid value
function snapX(v){
  if(snapWidgets) return Math.round(v/17.5)*17.5;
  return v;
}
function snapY(v){
  if(snapWidgets) return Math.round(v/17.5)*17.5;
  return v;
}
//elmnt is the widget your finished dragging or scaling
function updatePanels(elmnt){
  let index = indexMap[elmnt.id];
  let b = widgetArray[index];
  for(let i = 0; i < widgetArray.length; i++){
    if(widgetArray[i].type == '_box' && i != index){//if widget is a panel
      //add/remove widgets from panels
      let a = widgetArray[i];
      if(overlaps(a.left,a.top,a.w,a.h,  b.left,b.top,b.w,b.h)){
        if(!a.childids) a.childids = [];
        if(!a.childids.includes(elmnt.id)) a.childids.push(elmnt.id);

        get4position(elmnt);
        useSide(elmnt,a.useLeft,a.useTop);
        set4style(elmnt);

        break;
      }else{
        if(a.childids && a.childids.includes(elmnt.id)){
          a.childids.splice(a.childids.indexOf(elmnt.id),1);
        }
      }
    }
    else{
      if(i == index){
        let a = widgetArray[i];
        if(a.childids) for(let k = 0; k < a.childids.length; k++){
          let c = document.getElementById(a.childids[k]);
          get4position(c);
          useSide(c,a.useLeft,a.useTop);
          set4style(c);
        }
      }
    }
  }
}
function deleteFromPanel(elmntid){
  let index = indexMap[elmntid];
  let b = widgetArray[index];
  for(let i = 0; i < widgetArray.length; i++){
  if(widgetArray[i].type == '_box' && i != index){
    let a = widgetArray[i];
      if(a.childids && a.childids.includes(elmntid)){
        a.childids.splice(a.childids.indexOf(elmntid),1);
      }
    }
  }
}
//from topleft overlap check rectangle
function overlaps(x,y,w,h,  x2,y2,w2,h2){
  x=parseInt(x);
  x2=parseInt(x2);
  y=parseInt(y);
  y2=parseInt(y2);
  w=parseInt(w);
  w2=parseInt(w2);
  h=parseInt(h);
  h2=parseInt(h2);
  if(x+w>x2 && x<x2+w2   &&    y+h>y2 && y<y2+h2) return true;
  return false;
}

// ============================== ONBOARD TERMINAL ==============================
function openTerminal(){
  terminalIsOpen = true;
  mask.style.display = 'inline';
  terminal.style.display = 'inline';
}
function closeTerminal(){
  terminalIsOpen = false;
  mask.style.display = 'none';
  terminal.style.display = 'none';
}

function clearTerminal(){
  document.getElementById('cmdOutput').value = '';
  document.getElementById('cmdValue').placeholder = '';
}
function createStopButton(name){
  let code =
  '<button class="pbutton"style="width:90%;height:40px;display:block;margin-left:5%;margin-top:5px;"onclick="stopCmd(this)"value="'+name+'">'+
  name+'</button>';
  document.getElementById('processes').insertAdjacentHTML('beforeend',code);
}

//=================================== WIDGET CONFIGURATION PANEL============================================
//This is opened when you click the gear on a widget

//open configuration settings panel for each widget
function openConfig(e){
  //load field values with JSON settings
  elementOpenInConfig = e.parentElement.parentElement;
  currentID = elementOpenInConfig.id;
  currentIndex = indexMap[currentID];
  let WCI = widgetArray[currentIndex];
  lastChangedAxis = -1;
  lastChangedButton = -1;
  var type = WCI.type;
  updateHelpWindow(type);
  //pull generic data from widget array into the settings
  //non ros elements are exempt
  let topicInput = document.getElementById('topicTitle');
  let topicLabel = document.getElementById('topiclabel');
  if(!configSettings.lockRos) configSettings.lockRos = false;
  if(WCI.useROS && !configSettings.lockRos) {
    topicInput.style.display = 'inline-block';
    topicLabel.style.display = 'block';
  }
  else{
    topicInput.style.display = 'none';
    topicLabel.style.display = 'none';
  }
  topicInput.value = WCI['topic'];
  topicLabel.innerText = 'ROS Topic Name';
  //delete all the auto generated elements
  var paras = document.getElementsByClassName('specific')
  while(paras[0]) paras[0].parentNode.removeChild(paras[0]);
  switch(type){
    case '_button':
      createconfigInput('Button Label', '_button-labelText', WCI['label']);
      if(!configSettings.lockRos){
     createSelect('Message type', 'msgType', WCI['msgType'] ,['std_msgs/Bool','std_msgs/String','std_msgs/Float32','std_msgs/Float64','std_msgs/Int16','std_msgs/Int32','std_msgs/Int64']);
      createconfigInput('Value to send on press', 'onPress', WCI['onPress'] || 'true');
      createconfigInput('Value to send on release', 'onRelease', WCI['onRelease'] || 'false');
    }
      createLittleInput('Font Size (px)', 'fontsize', WCI['fontsize'],16);
      createconfiglinkGamepadButton(WCI);
      createconfiglinkKeys(WCI);
    break;
    case '_joystick':
    if(!configSettings.lockRos) createText('geometry_msgs/Vector3');
      createconfiglinkGamepadAxis(WCI);
      createconfiglinkKeys(WCI,['up','left','down','right']);
    break;
  case '_trigger':
    if(!configSettings.lockRos) createSelect('Message type', 'msgType', WCI['msgType'] ,['std_msgs/Float64','std_msgs/Float32']);
      createText('To use, make sure the gamepad is in XInput mode (X), not DirectInput (x)');
      createconfiglinkGamepadPaddle(WCI);
    createColorSelect('Bar color','bar',WCI.bar==undefined?'#71ea71':WCI.bar);
    createColorSelect('Background color','back',WCI.back==undefined?'#FFFFFF':WCI.back);
    createSelect('Extend from edge', 'edge', WCI['edge'] ,['Left','Right','Top','Bottom']);
    break;
  case '_mouse':
    if(!configSettings.lockRos) createText('geometry_msgs/Vector3');
      createText('The z component is the mouse state. 0 is nothing. 1 is left mouse. 2 is right mouse');
    break;
    case '_checkbox':
      createconfigInput('Label', 'label', WCI['label']);
      if(!configSettings.lockRos){
     createSelect('Message type', 'msgType', WCI['msgType'] ,['std_msgs/Bool','std_msgs/String','std_msgs/Float32','std_msgs/Float64','std_msgs/Int16','std_msgs/Int32','std_msgs/Int64']);
      createconfigInput('Value to send when checked', 'onPress', WCI['onPress'] || 'true');
      createconfigInput('Value to send when unchecked', 'onRelease', WCI['onRelease'] || 'false');
    }
      createCheckbox('Initial State', 'initialState', WCI['initial']);
      if(!configSettings.lockRos) createCheckbox('ROS Latching', 'latching', WCI['latching']);
      createconfiglinkGamepadButton(WCI);
      createconfiglinkKeys(WCI,['hotkey']);
      createColorSelect('Text Color','textColor',WCI.textColor);
    break;
    case '_slider':
    createconfigInput('Widget Name', 'name', WCI['name']);
    if(!configSettings.lockRos) createText('std_msgs/Float64');
    createRange(WCI);
    createCheckbox('Orient Vertical', 'vertical', WCI['vertical']);
    if(!configSettings.lockRos) createCheckbox('ROS Latching', 'latching', WCI['latching']);
    createCheckbox('Flip Direction', 'reverse', WCI['reverse']);
    createconfigInput('Default/initial value', 'default', WCI['default']);
    createconfiglinkKeys(WCI,['Decrease','Increase']);
    createconfiglinkGamepadButton(WCI,['Decrease','Increase']);
    createLittleInput('Repeat Delay (ms)', 'repeatdelay', WCI['repeatdelay'],100);
    break;
    case '_inputbox':
    if(!configSettings.lockRos) createSelect('Message type', 'msgType', WCI['msgType'] ,['std_msgs/String','std_msgs/Float32','std_msgs/Float64','std_msgs/Int16','std_msgs/Int32','std_msgs/Int64']);
    createCheckbox('Erase value after send', 'erase', WCI['erase']);
  break;
  case '_dropdown':
    if(!configSettings.lockRos) createSelect('Subscribe to message type', 'msgType', WCI['msgType'] ,['std_msgs/String','std_msgs/Float32','std_msgs/Float64','std_msgs/Int16','std_msgs/Int32','std_msgs/Int64']);
    if(!configSettings.lockRos) createCheckbox('ROS Latching', 'latching', WCI['latching']);
    openDropdownConfig(WCI.dropdowns);
    break;
    case '_value':
      createconfigDataWrapper(WCI);
      if(!configSettings.lockRos) createSelect('Subscribe to message type', 'msgType', WCI['msgType'] ,['std_msgs/String','std_msgs/Float32','std_msgs/Float64','std_msgs/Int16','std_msgs/Int32','std_msgs/Int64','std_msgs/Bool']);
    createColorSelect('Text Color','textColor',WCI.textColor);
    createFormat(WCI);
    break;
    case '_light':
      createconfigInput('True label', 'text', WCI['text']);
    createColorSelect('True color','textColor',WCI.textColor==undefined?'#75FF75':WCI.textColor);
    createBreak();
    createBreak();
    createBreak();
    createconfigInput('False label', 'text2', (WCI['text2']==undefined || WCI['text2']=='')?WCI['text']:WCI['text2']);
    createColorSelect('False color','textColor2',WCI.textColor2==undefined?'#FF6666':WCI.textColor2);
    if(!configSettings.lockRos) createText('std_msgs/Bool');
    break;
    case '_gauge':
    createconfigInput('Label', 'label', WCI['label']);
    if(!configSettings.lockRos) createSelect('Subscribe to message type', 'msgType', WCI['msgType'] ,['std_msgs/Float64','std_msgs/Float32','std_msgs/Int16','std_msgs/Int32','std_msgs/Int64']);
    createGraph(WCI);
    createFormat(WCI);
    break;
    case '_compass':
    createconfigInput('Label', 'label', WCI['label']);
    createText('0 is north, increasing clockwise in degrees.');
    if(!configSettings.lockRos) createSelect('Subscribe to message type', 'msgType', WCI['msgType'] ,['std_msgs/Float64','std_msgs/Float32','std_msgs/Int16']);
    break;
    case '_horizon':
    createconfigInput('Label', 'label', WCI['label']);
    createText('[0]=Roll,[1]=Pitch in degrees');
    if(!configSettings.lockRos) createSelect('Subscribe to message type', 'msgType', WCI['msgType'] ,['std_msgs/Float64MultiArray','std_msgs/Float32MultiArray']);
    break;
  case '_arm':
    if(!configSettings.lockRos) createSelect('Subscribe to message type', 'msgType', WCI['msgType'] ,['std_msgs/Float64MultiArray','std_msgs/Float32MultiArray']);
    createText('All angles are in degrees');
    openArmConfig(WCI['arms']);
    break;
    case '_rosImage':
    createText('This widget subscribes to sensor_msgs/CompressedImage.');
    if(!configSettings.lockRos){
      createText('Or');
      createconfigInput('Enter the image source (URL)', 'src', WCI['src']);
      createCheckbox('Maintain aspect ratio', 'aspr', WCI['aspr']);
    }
    createconfigInput('Opacity (0-100, 0 being completley transparent)', 'opac', WCI['opac']);
    createCheckbox('Center on screen', 'center', WCI['center']);
    createCheckbox('Keep behind all other widgets', 'sendtoback', WCI['sendtoback']);
    createCheckbox('Fullscreen mode (image fills entire screen)', 'fullscreen', WCI['fullscreen']);
    createconfigInput('Z index (only in fullscreen mode) (between -100 and 0) see info for details', 'zindex', WCI['zindex']);
  break;
  case '_logger':
    if(!configSettings.lockRos){
      createText('std_msgs/String');
      createCheckbox('ROS Latching', 'latching', WCI['latching']);
    }
  break;
    case '_audio':
    if(!configSettings.lockRos) createText('Subscribes to std_msgs/Int16');
      createCheckbox('Hide this widget in drive mode', 'hideondrive', WCI['hideondrive']);
      createSoundsList();
    break;
  case '_serial':
      topicLabel.innerText = 'ROS to USB topic';
      if(!configSettings.lockRos) {
        createconfigInput('USB to ROS topic', 'topic2', WCI['topic2']);
        createText('Subscribes and publishes std_msgs/String');
      }
      createSelect('Baudrate', 'baud', WCI['baud'] || 9600,[2400, 4800, 9600, 19200, 38400, 57600, 115200]);
      createSelect('ROS to USB appended line ending', 'rosLE', WCI['rosLE'] || 'None',['None','Newline (10)','Carrage Return (13)','NL and CR (10 & 13)']);
      createSelect('USB to ROS split with', 'usbLE', WCI['usbLE'] || 'NL and/or CR (10 & 13)',['Newline (10)','Carrage Return (13)','NL and/or CR (10 & 13)']);
  break;
  case '_mic':
    if(!elementOpenInConfig.querySelector('#mic_ap').isMuted) elementOpenInConfig.querySelector('#mic_ap').toggle();
    createText('For use with the audio_common player node, the topic name must be /audio/audioplay');    
    createText('Publishes to audio_common_msgs/AudioData.msg');
    createconfigInput('Label', 'mclabel', WCI['label']);
    createconfiglinkGamepadButton(WCI);
        createconfiglinkKeys(WCI,['hotkey']);
  break;
  case '_speaker':
    if(!elementOpenInConfig.querySelector('#speaker_ap').isMuted) elementOpenInConfig.querySelector('#speaker_ap').toggle();
    createText('For use with the audio_common capture node, the topic name must be /audio/audiocapture');
    createText('Subscribes to audio_common_msgs/AudioData.msg');
    createconfigInput('Label', 'splabel', WCI['label']);
    createconfiglinkGamepadButton(WCI);
        createconfiglinkKeys(WCI,['hotkey']);
  break;
    case '_text':
    createconfigInput('Text', 'text', WCI['text']);
    createColorSelect('Text Color','textColor',WCI.textColor);
    break;
    case '_box':
    createColorSelect('Background Color','bkColor',WCI.bkColor);
    break;
  }
  mask.style.display='inline';
  configWindow.style.display='inline';
  configIsOpen = true;
}

//==================================== APPLY CONFIG CHANGES =============================
function applyConfigChanges(){
  //the widget were applying settings on
  var localWidget = document.getElementById(currentID);
  var topic = document.getElementById('topicTitle').value;
  widgetArray[currentIndex].topic = topic;
  var WA = widgetArray[currentIndex];
  var type = WA.type;
  var oldlatching = false;
  switch(type){
    case '_button':
      WA['label'] = document.getElementById('_button-labelText').value;
      localWidget.querySelector('#button_ap').innerText = WA['label'];
      
    if(!configSettings.lockRos){
    WA['onPress'] = document.getElementById('onPress').value || "true";
    WA['onRelease'] = document.getElementById('onRelease').value || "false";
    WA['msgType'] = document.getElementById('msgType').value;
    }
      WA['useGamepad'] = document.getElementById('useGamepad').checked;
      WA['useKeys'] = document.getElementById('useKeys').checked;
      WA['usekey_hotkey'] = document.getElementById('usekey_hotkey').value;
      WA['fontsize'] = document.getElementById('fontsize').value;
      localWidget.querySelector('#button_ap').style.fontSize = (parseFloat(WA['fontsize'])<4?4:parseFloat(WA['fontsize']))+'px';
      if(lastChangedButton != -1) WA['useButton'] = lastChangedButton;
    break;
    case '_checkbox':
      WA['label'] = document.getElementById('label').value;
      WA['initial'] = document.getElementById('initialState').checked;
      if(!configSettings.lockRos){
    oldlatching = WA['latching'];
        WA['latching'] = document.getElementById('latching').checked;
    WA['onPress'] = document.getElementById('onPress').value || "true";
    WA['onRelease'] = document.getElementById('onRelease').value || "false";
    WA['msgType'] = document.getElementById('msgType').value;
      }
      WA['textColor'] = document.getElementById('textColor').value;
      localWidget.querySelector('#checkbox_text_ap').innerText = WA['label'];
      WA['useGamepad'] = document.getElementById('useGamepad').checked;
      WA['useKeys'] = document.getElementById('useKeys').checked;
      WA['usekey_hotkey'] = document.getElementById('usekey_hotkey').value;
      if(lastChangedButton != -1) WA['useButton'] = lastChangedButton;
      localWidget.querySelector('#checkbox_text_ap').style.color = WA['textColor'];
    break;
    case '_joystick':
      WA['useGamepad'] = document.getElementById('useGamepad').checked;
      WA['useKeys'] = document.getElementById('useKeys').checked;
      WA['usekey_up'] = document.getElementById('usekey_up').value;
      WA['usekey_left'] = document.getElementById('usekey_left').value;
      WA['usekey_down'] = document.getElementById('usekey_down').value;
      WA['usekey_right'] = document.getElementById('usekey_right').value;
      if(lastChangedAxis != -1) WA['useAxis'] = lastChangedAxis;
    break;
  case '_trigger':
      WA['useGamepad'] = document.getElementById('useGamepad').checked;
    if(lastChangedButton != -1) WA['useButton'] = lastChangedButton;
    if(!configSettings.lockRos){
    WA['msgType'] = document.getElementById('msgType').value;
      }
    WA.bar = document.getElementById('bar').value;
    WA.back = document.getElementById('back').value;
    WA.edge = document.getElementById('edge').value;
    localWidget.querySelector('#paddle_background').style.background = WA.back;
    localWidget.querySelector('#paddle_ap').style.background = WA.bar;
    break;
    case '_slider':
      WA['min'] = document.getElementById('min').value;
      WA['max'] = document.getElementById('max').value;
      WA['step'] = document.getElementById('step').value;
      WA['name'] = document.getElementById('name').value;
      if(!configSettings.lockRos){
      oldlatching = WA['latching'];
        WA['latching'] = document.getElementById('latching').checked;
    }
    WA['reverse'] = document.getElementById('reverse').checked;
      let oldVertical = WA['vertical'];
      WA['vertical'] = document.getElementById('vertical').checked;
      WA['default'] = document.getElementById('default').value;
      localWidget.querySelector('#slider_ap').min = WA['min'];
      localWidget.querySelector('#slider_ap').max = WA['max'];
      localWidget.querySelector('#slider_ap').step = WA['step'];
      if(oldVertical != WA['vertical']){
    if(WA['vertical'] == true){
      localWidget.style.width = '35px';
      localWidget.style.height = '200px';
      WA['w'] = localWidget.style.width;
      WA['h'] = localWidget.style.height;
      localWidget.querySelector('#slider_ap').className += ' vertical';
      localWidget.querySelector('#slider_ap').style.width =(parseInt(WA['h'])-27) + 'px';
    }else{
      localWidget.style.height = '50px';
      localWidget.style.width = '200px';
      WA['h'] = localWidget.style.height;
      WA['w'] = localWidget.style.width;
      localWidget.querySelector('#slider_ap').className = localWidget.querySelector('#slider_ap').className.replace(/ vertical/g,'');
      localWidget.querySelector('#slider_ap').style.width = 'calc(100% - 5px)';
    }
     }
    WA['useGamepad'] = document.getElementById('useGamepad').checked;
      WA['useKeys'] = document.getElementById('useKeys').checked;
      WA['usekey_Increase'] = document.getElementById('usekey_Increase').value;
      WA['usekey_Decrease'] = document.getElementById('usekey_Decrease').value;
      WA['gp_Increase'] = document.getElementById('gp_Increase').value;
      WA['gp_Decrease'] = document.getElementById('gp_Decrease').value;
      WA['repeatdelay'] = document.getElementById('repeatdelay').value;
    break;
  case '_dropdown':
    if(!configSettings.lockRos){
      WA['msgType'] = document.getElementById('msgType').value;
        oldlatching = WA['latching'];
          WA['latching'] = document.getElementById('latching').checked;
     }
    let dropdowns = [];
    let newDropdowns = document.getElementsByClassName('armdiv'); //shares the same css, and arms never coexist with dropdowns
    var lastUsedIndex = 0;
    var i = 0;
    for(let k = 0; k < newDropdowns.length; k+=1){
      if(newDropdowns[k].querySelector('#dropdowntext')){
        dropdowns[i] = {};
        dropdowns[i].text = newDropdowns[k].querySelector('#dropdowntext').value;
        i++;
      }
    }
    WA.dropdowns = dropdowns;
      console.log(localWidget);
    localWidget.querySelector('#selector_ap').innerHTML = generateSelectorOptions(dropdowns);
  break;
  case '_arm':
    if(!configSettings.lockRos) WA['msgType'] = document.getElementById('msgType').value;
    let newArms = [];
    let armdivs = document.getElementsByClassName('armdiv');
    var lastUsedIndex = 0;
    var i = 0;
    for(let k = 0; k < armdivs.length; k+=1){
      if(armdivs[k].querySelector('#armmode')){
        newArms[i] = {};
        newArms[i].mode = parseInt(armdivs[k].querySelector('#armmode').value);
        newArms[i].data = parseFloat(armdivs[k].querySelector('#armdata').value);
        newArms[i].armlength = parseFloat(armdivs[k].querySelector('#armlength').value);
        newArms[i].color = armdivs[k].querySelector('#armcolor').value;
        i++;
      }
    }
    WA.arms = newArms;
    drawArm(localWidget.querySelector('#arm_ap'),WA.arms);
  break;
    case '_inputbox':
      if(!configSettings.lockRos) WA['msgType'] = document.getElementById('msgType').value;
    WA['erase'] = document.getElementById('erase').checked;
    break;
    case '_value':
      WA['prefix'] = document.getElementById('textInput1').value;
      WA['postfix'] = document.getElementById('textInput2').value;
      if(!configSettings.lockRos) WA['msgType'] = document.getElementById('msgType').value;
      WA['textColor'] = document.getElementById('textColor').value;
      WA['formatmode'] = document.getElementById('formatmode').value;
      WA['formatvalue'] = document.getElementById('formatvalue').value;
      localWidget.querySelector('#text_ap').style.color = WA['textColor'];
    break;
    case '_light':
      WA['text'] = document.getElementById('text').value;
      WA['textColor'] = document.getElementById('textColor').value;
    WA['text2'] = document.getElementById('text2').value
    WA['textColor2'] = document.getElementById('textColor2').value;
      localWidget.querySelector('#text_ap').innerText = WA['text'];
    break;
    case '_audio':
    WA['hideondrive'] = document.getElementById('hideondrive').checked;
    if(WA['hideondrive']){
      localWidget.querySelector('#speaker_ap').className = '';
    }
    else{
      localWidget.querySelector('#speaker_ap').className = 'showOnDrive';
    }
    break;
    case '_gauge':
      WA['min'] = document.getElementById('min').value;
      WA['max'] = document.getElementById('max').value;
      if(Number(WA.max) < Number(WA.min)){
      WA['max'] = document.getElementById('min').value;
      WA['min'] = document.getElementById('max').value;
    }
      WA['bigtick'] = document.getElementById('bigtick').value;
      if(Number(WA.bigtick) > Number(WA.max) - Number(WA.min)) WA['bigtick'] = Number(WA.max) - Number(WA.min);
      if(Number(WA.bigtick) < 0) WA['bigtick'] = 0.05;
      WA['smalltick'] = document.getElementById('smalltick').value;
      if(Number(WA.smalltick) > 100) WA['smalltick'] = 100;
      if(Number(WA.smalltick) < 0) WA['smalltick'] = 0;
      WA['label'] = document.getElementById('label').value;
      if(!configSettings.lockRos) WA['msgType'] = document.getElementById('msgType').value;
      WA['formatmode'] = document.getElementById('formatmode').value;
      WA['formatvalue'] = document.getElementById('formatvalue').value;
      let obj = JSON.stringify({min:WA.min,max:WA.max,bigtick:WA.bigtick,smalltick:WA.smalltick, title:WA.label});
      localWidget.querySelector('#gauge_ap').setAttribute("data-config",obj);
      drawGauge(localWidget.querySelector('#gauge_ap'),WA.min,WA);
    break;
    case '_compass':
      if(!configSettings.lockRos) WA['msgType'] = document.getElementById('msgType').value;
      WA['label'] = document.getElementById('label').value;
    break;
    case '_horizon':
      if(!configSettings.lockRos) WA['msgType'] = document.getElementById('msgType').value;
      WA['label'] = document.getElementById('label').value;
    break;
    case '_rosImage':
    WA['src'] = document.getElementById('src').value;
    WA['opac'] = Math.max(0,Math.min(100,Number(document.getElementById('opac').value) || 100));
    localWidget.querySelector('#img_ap').style.opacity = WA.opac+'%';
    if(!configSettings.lockRos){
      if(!WA.src) localWidget.querySelector('#img_ap').src = 'res/phImg.jpg';
      else localWidget.querySelector('#img_ap').src = WA.src;
    }
    WA['aspr'] = document.getElementById('aspr').checked;
    WA['center'] = document.getElementById('center').checked;
    WA['sendtoback'] = document.getElementById('sendtoback').checked;
      
    if(WA.aspr) localWidget.querySelector('#img_ap').className = 'showOnDrive containImage';//aspect ratio
    else localWidget.querySelector('#img_ap').className = 'showOnDrive stretchImage';//aspect ratio
    WA['fullscreen'] = document.getElementById('fullscreen').checked;
    WA['zindex'] = Math.max(-100,Math.min(0,Number(document.getElementById('zindex').value) || -51));
      
    set4style(localWidget,WA);
    break;
    case '_logger':
    if(!configSettings.lockRos) WA['latching'] = document.getElementById('latching').checked;
    break;
  case '_serial':
    if(!configSettings.lockRos){
      WA['topic2'] = document.getElementById('topic2').value;
      if(WA.baud != document.getElementById('baud').value){
        if(localWidget.serialObject){
          if(localWidget.serialObject.connected){
            localWidget.serialObject.end();
          }
        }
        WA['baud'] = document.getElementById('baud').value;
      }
    }
    WA.rosLE = document.getElementById('rosLE').value;
    WA.usbLE = document.getElementById('usbLE').value;
    if(localWidget.serialObject){
      if(localWidget.serialObject.connected){
         localWidget.serialObject.rosLE = WA.rosLE;
        localWidget.serialObject.usbLE = WA.usbLE;
      }
    }
  break;
  case '_mic':
      WA['useGamepad'] = document.getElementById('useGamepad').checked;
    if(lastChangedButton != -1) WA['useButton'] = lastChangedButton;
      WA['useKeys'] = document.getElementById('useKeys').checked;
      WA['usekey_hotkey'] = document.getElementById('usekey_hotkey').value;
    WA['label'] = document.getElementById('mclabel').value;
      localWidget.querySelector('#label_ap').innerText = WA['label'];
    break;
  case '_speaker':
      WA['useGamepad'] = document.getElementById('useGamepad').checked;
    if(lastChangedButton != -1) WA['useButton'] = lastChangedButton;
      WA['useKeys'] = document.getElementById('useKeys').checked;
      WA['usekey_hotkey'] = document.getElementById('usekey_hotkey').value;
    WA['label'] = document.getElementById('splabel').value;
      localWidget.querySelector('#label_ap').innerText = WA['label'];
    break;
    case '_text':
      WA['text'] = document.getElementById('text').value;
      WA['textColor'] = document.getElementById('textColor').value;
      localWidget.querySelector('#text_ap').style.color = WA['textColor'];
      localWidget.querySelector('#text_ap').innerText = WA['text'];
    break;
    case '_box':
      WA['bkColor'] = document.getElementById('bkColor').value;
      localWidget.querySelector('#panel_ap').style.backgroundColor = WA['bkColor'];
    break;
  }
  mask.style.display='none';
  configWindow.style.display='none';
  configIsOpen = false;
  updateTopicMapIndex();
  sendWidgetsArray();

  //now send initial state if latching:
  if(oldlatching != WA['latching'] && WA['latching'] && !configSettings.lockRos){
    console.log('update latch status');
  switch(type){
    case '_checkbox':
      sendToRos(WA['topic'],{value:WA['initial'] ? WA['onPress'] : WA['onRelease']},'_checkbox');
      localWidget.querySelector('#checkbox_ap').checked = WA['initial'];
    break;
    case '_slider':
      sendToRos(WA['topic'],{value:WA['default']},'_slider');
    break;
  }
  }
}
function guardTopicName(ele){
  let fstr = ele.value.trim();
  str='';
  for(let i = 0; i < fstr.length; i++){
    if(i==0)str = str+fstr.charAt(i).replace(/[^a-zA-Z~/]/g,'');
    else str=str+fstr.charAt(i).replace(/[^a-zA-Z0-9_/]/g,'')
  }
  ele.value = str;
}

//===================== FUNCTIONS TO GENERATE HTML ELEMENTS FOR CONFIG PANEL ======================
function generateSelectorOptions(opts = [{text:'Option 1',value:'Option 1'},{text:'Option 2',value:'Option 2'}]){
  var html = '';
  for(let i = 0; i < opts.length; i++){
    html += `<option value='${opts[i].text}'>${opts[i].text}</option>`;
  }
  return html;
}
//opts include mode, data, length, color
function returnArmHTML(opts){
  if(opts == undefined) opts = {mode:0,data:0,armlength:1,color:'#000000'};
  let html =
    '<div class="armdiv specific">'+
      '<select id="armmode" class="armdivselect">'+(opts.mode==1?
                       '<option value="1">Fixed angle</option><option value="0">Array index</option>':
                       '<option value="0">Array index</option><option value="1">Fixed angle</option>')+'</select>'+
      '<input id="armdata" class="armdivinput" value="'+(opts.data || 0)+'">'+
      '<p class="armdivtext">length</p>'+
      '<input id="armlength" class="armdivinput" placeholder="inches" value="'+(opts.armlength || 1)+'">'+
      '<input id="armcolor" type="color" value="'+(opts.color || '#000000')+'">'+
    '</div><br class="specific armdiv">';
  return html;
}
function returnDropdownHTML(opts){
  if(opts == undefined) opts = {text:'Option 1'};
  let html =
    '<div class="armdiv specific">'+
      '<p class="armdivtext">Value: </p>'+
      '<input style="width:300px"id="dropdowntext" class="armdivinput" value="'+(opts.text || '')+'">'+
    '</div><br class="specific armdiv">';
  return html;
}
//add another arm to an arm widget (just the graphical part)
function removeArmHTML(){
  let armdivs = document.getElementsByClassName('armdiv');
  if(armdivs.length > 2){  //keep at least 1 arm
    armdivs[armdivs.length-1].remove();
    armdivs[armdivs.length-1].remove();//remove the <br> under the div as well
  }
}
//dropdown and arm share class names sometimes to prevent repetitive css
function removeDropdownHTML(){
  let armdivs = document.getElementsByClassName('armdiv');
  if(armdivs.length > 2){  //keep at least 1 dropdown
    armdivs[armdivs.length-1].remove();
    armdivs[armdivs.length-1].remove();//remove the <br> under the div as well
  }
}
function addDropdownHTML(){
  let armdivs = document.getElementsByClassName('armdiv');
  if(armdivs.length < 6*2) configWindow.insertAdjacentHTML("beforeend",returnDropdownHTML({text:'New option'}));//limit to 6 arms, (*2 because each div block has a <br> by the same class
}
function addArmHTML(){
  let armdivs = document.getElementsByClassName('armdiv');
  let lastUsedIndex = 0;
  for(let i = 0; i < armdivs.length; i++){
    let s = armdivs[i].querySelector('#armmode');
    if(s && s.value == 0){
      let input = armdivs[i].querySelector('#armdata');
      if(parseInt(input.value) >= lastUsedIndex) lastUsedIndex = parseInt(input.value)+1;
    }
  }
  if(armdivs.length < 6*2) configWindow.insertAdjacentHTML("beforeend",returnArmHTML({data:lastUsedIndex}));//limit to 6 arms, (*2 because each div block has a <br> by the same class
}
function openArmConfig(armArray){
  if(armArray == undefined) armArray = [{mode:1,data:60,armlength:5,color:'#000000'},{mode:1,data:60,armlength:5,color:'#000000'}];
  console.log('current array', armArray);
  let html =
    '<button class="armdivselect specific" onclick="addArmHTML()">Add arm</button>'+
    '<button class="armdivselect specific" onclick="removeArmHTML()">Remove arm</button><br class="specific">';
  for(let i = 0; i < armArray.length; i++) html += returnArmHTML(armArray[i]);
  configWindow.insertAdjacentHTML('beforeend',html);
}
function openDropdownConfig(dropdownArray){
  if(dropdownArray == undefined) dropdownArray = [{text:'Option 1'},{text:'Option 2'}];
  let html =
    '<br><button class="armdivselect specific" onclick="addDropdownHTML()">Add another option</button>'+
    '<button class="armdivselect specific" onclick="removeDropdownHTML()">Remove option</button><br class="specific">';
  for(let i = 0; i < dropdownArray.length; i++) html += returnDropdownHTML(dropdownArray[i]);
  configWindow.insertAdjacentHTML('beforeend',html);
}

function createSoundsList(){
  let code = '';
  for(let i = 0; i < sounds.length; i++){
    code += ('<button class="specific soundbutton" onclick="playSound('+i+')">preview sound '+i+': "'+sounds[i]+'"</button>');
  }
  configWindow.insertAdjacentHTML('beforeend',code);
}
function createText(text){
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific selectable';
  label.style.margin.top = '5px';
  label.innerText = text;
  configWindow.appendChild(label);
}
function createBreak(){
  configWindow.insertAdjacentHTML('beforeend','<br class="specific">');
}
function createconfigInput(labelText, inputID, inputvalue){
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific';
  label.style.margin.top = '20px';
  label.innerText = labelText;
  var content = document.createElement("input");
  content.className = 'settingInput specific';
  content.id=inputID;
  content.value = (inputvalue==undefined?'':inputvalue);
  configWindow.appendChild(label);
  configWindow.appendChild(content);
}
function createLittleInput(labelText, inputID, inputvalue,defaultvalue){
  if(!defaultvalue) defaultvalue = '';
  configWindow.insertAdjacentHTML('beforeend','<br class="specific"><p class="specific" style="margin:10px 0px;display:inline-block"><b>'+labelText+'</p> <input value="'+(inputvalue==undefined?defaultvalue:inputvalue)+'"class="specific" id='+inputID+' style="margin:0px; width:50px"></input>');
}
function createCheckbox(labelText, inputID, inputvalue){
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific';
  label.style.margin.top = '20px';
  label.innerHTML = labelText + " <input id='"+inputID+"'class='specific' type='checkbox'></input>";
  var content = document.createElement("input");
  configWindow.appendChild(label);
  document.getElementById(inputID).checked = inputvalue;
}
//inputvalue is currently selected value from opts
function createSelect(labelText, inputID, inputvalue, opts){
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific';
  label.innerHTML = labelText;
  configWindow.appendChild(label);
  var content = document.createElement("select");
  content.className = 'specific';
  content.id=inputID;
  for(let i = 0; i < opts.length; i++){
  content.innerHTML += "<option value='"+opts[i]+"'>"+opts[i]+"</option>";
  }
  content.style.marginBottom = '20px';
  configWindow.appendChild(content);
  if(inputvalue != undefined && inputvalue != '') document.getElementById(inputID).value = inputvalue;
}
function createColorSelect(labelText, inputID, inputvalue){
  if(inputvalue == undefined) inputValue = '#000';
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific';
  label.style.margin.top = '20px';
  label.innerHTML = labelText;
  configWindow.appendChild(label);
  var content = document.createElement("input");
  content.type = 'color';
  content.className = 'specific';
  content.id=inputID;
  content.value = inputvalue;
  configWindow.appendChild(content);
}
function createconfiglinkGamepadAxis(array){
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific';
  label.style.margin = '20px 0px 0px 0px';
  label.innerHTML = 'Use gamepad input <input id="useGamepad" type="checkbox"></input>';
  label.style.margin.bottom = '0px';
  var axisText = document.createElement("p");
  axisText.className = 'specific';
  axisText.id='replaceWithCAxis';
  axisText.style.margin = '0px';
  if(array["useAxis"] == -1) axisText.innerHTML = 'Wiggle a joystick on the gamepad to link...';
  else axisText.innerHTML = 'Paired to axis: '+array['useAxis'];
  configWindow.appendChild(label);
  configWindow.appendChild(axisText);
  document.getElementById('useGamepad').checked = array["useGamepad"];
}
function createconfiglinkGamepadButton(array, opts){
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific';
  label.style.margin = '20px 0px 0px 0px';
  label.innerHTML = 'Use gamepad input <input id="useGamepad" type="checkbox"></input>';
  label.style.margin.bottom = '0px';
  configWindow.appendChild(label);
  if(!opts){
  var buttonText = document.createElement("p");
  buttonText.className = 'specific';
  buttonText.id='replaceWithCButton';
  buttonText.style.margin = '0px';
  if(array["useButton"] == -1) buttonText.innerHTML = 'Press a button on the gamepad to link...';
  else buttonText.innerHTML = 'Paired to button: '+array['useButton'];
  configWindow.appendChild(buttonText);
  }else{
  var buttonText = document.createElement("p");
  buttonText.className = 'specific';
  buttonText.id='replaceWithCButton';
  buttonText.style.margin = '0px';
  buttonText.style.display = 'none';
  if(array["useButton"] == -1) buttonText.innerHTML = 'Press a button on the gamepad...';
  else buttonText.innerHTML = 'Paired to button: '+array['useButton'];
  configWindow.appendChild(buttonText);
  configWindow.insertAdjacentHTML('beforeend','<p class="specific" style="margin:0px">click on input box below and press gamepad button</p>');
  for(let i = 0; i <opts.length; i++){
     configWindow.insertAdjacentHTML('beforeend',' <p class="specific" style="margin:0px;display:inline-block">'+opts[i]+'</p> <input class="specific gamepad" id=gp_'+opts[i]+' style="margin:0px; width:50px"></input>');
     if(array['gp_'+opts[i]] != undefined) document.getElementById('gp_'+opts[i]).value = array['gp_'+opts[i]];
   }
  }
  document.getElementById('useGamepad').checked = array["useGamepad"];
}
function createconfiglinkGamepadPaddle(array){
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific';
  label.style.margin = '20px 0px 0px 0px';
  label.innerHTML = 'Use gamepad input <input id="useGamepad" type="checkbox" />';
  label.style.margin.bottom = '0px';
  configWindow.appendChild(label);
  var buttonText = document.createElement("p");
  buttonText.className = 'specific';
  buttonText.id='replaceWithPButton';
  buttonText.style.margin = '0px';
  if(array["useButton"] == -1) buttonText.innerHTML = 'Press a paddle on the gamepad to link...';
  else buttonText.innerHTML = 'Paired to paddle: '+array['useButton'];
  configWindow.appendChild(buttonText);
  document.getElementById('useGamepad').checked = array["useGamepad"];
}
function createconfiglinkKeys(array,keylabels=['hotkey']){
  var label = document.createElement("h1");
  label.className = 'settingsLabel specific';
  label.style.margin = '20px 0px 0px 0px';
  label.innerHTML = 'Use keyboard input <input id="useKeys" type="checkbox"></input>';
  label.style.margin.bottom = '0px';
  configWindow.appendChild(label);
  var label2 = document.createElement("p");
  label2.className = 'specific';
  label2.style.margin = '0px';
  let innerhtml='';
  for(let i = 0; i < keylabels.length; i++){
    let value = array['usekey_'+keylabels[i]];
    if(value == undefined) value = '';
    innerhtml += keylabels[i]+' <input class="hotkeys" style="width:50px;margin-right:5px;" id="usekey_'+keylabels[i]+'" value="'+value+'"></input>';
  }
  label2.innerHTML = innerhtml;
  label2.style.margin.bottom = '0px';
  configWindow.appendChild(label2);
  if(array["useKeys"] == undefined) array["useKeys"] = true;
  document.getElementById('useKeys').checked = array["useKeys"];
  let allHotkeys = document.getElementsByClassName('hotkeys');
  for(let i = 0; i < keylabels.length; i++){
    allHotkeys[i].addEventListener("keyup",event=>{
      allHotkeys[i].value= event.key;
    });
  }
}
function createconfigDataWrapper(array){
  let prefix = array.prefix;
  let postfix = array.postfix;
  if(prefix == undefined) prefix = '';
  if(postfix == undefined) postfix = '';
  let p = document.createElement('p');
  p.style.marginBottom = '20px';
  p.className = 'specific settingsLabel';
  p.innerHTML = "Prefix: <input id='textInput1'value='"+prefix+"'></input> Postfix: <input id='textInput2'value='"+postfix+"'></input>";
  configWindow.appendChild(p);
}
function createFormat(array){
  let formatmode = array.formatmode;
  let formatvalue = array.formatvalue;
  if(formatmode == undefined) formatmode = 0;
  if(formatvalue == undefined) formatvalue = 2;
  let code =
  '<h3 class="specific" style="margin:20px 0px 5px 0px">Number Formatting</h1><select id="formatmode" class="specific">'+
  '<option value="0">Fixed decimal points</option>'+
  '<option value="1">Precision (digits)</option>'+
  '<option value="2">None</option>'+
  '</select><input id="formatvalue" class="specific" style="width:50px; margin-left:5px"></input>';
  configWindow.insertAdjacentHTML('beforeend',code);
  document.getElementById('formatmode').value=formatmode;
  document.getElementById('formatvalue').value=formatvalue;
}
function createGraph(array){
  let label = array.label;
  let min = array.min;
  let max = array.max;
  let bigtick = array.bigtick;
  let smalltick = array.smalltick;
  if(min == undefined) min = 0;
  if(max == undefined) max = 100;
  if(bigtick == undefined) bigtick = 20;
  if(smalltick == undefined) smalltick = 4;
  if(label == undefined) label = '';
  let p = document.createElement('p');
  p.style.marginBottom = '20px';
  p.className = 'specific';
  p.innerHTML = "Min: <input class='miniInput' id='min'value='"+min+"'></input><br> Max: <input class='miniInput' id='max'value='"+max+"'></input><br> Big Tick Interval: <input class='miniInput' id='bigtick'value='"+bigtick+"'></input><br> Subdivisions: <input class='miniInput' id='smalltick'value='"+smalltick+"'></input>";
  configWindow.appendChild(p);
}
function createRange(array){
  let min = array.min;
  let max = array.max;
  let step = array.step;
  if(min == undefined) min = '0';
  if(max == undefined) max = '100';
  if(step == undefined) step = '1';
  let p = document.createElement('p');
  p.style.marginBottom = '20px';
  p.className = 'specific';
  p.innerHTML = "Min: <input id='min'value='"+min+"'></input> Max: <input id='max'value='"+max+"'></input> Step: <input id='step'value='"+step+"'></input>";
  configWindow.appendChild(p);
}

//====================== KEYBOARD INTERFACING ====================
var inc; //interval id. also used in gamepad loop
document.addEventListener('keydown', (e) => {
  if(!configIsOpen && !terminalIsOpen){
    oldKeys = {...keys};
    keys[e.key] = true;
    getKeyboardUpdates();
  }
});
document.addEventListener('keyup', (e) => {
  if(!configIsOpen && !terminalIsOpen){
    oldKeys = {...keys};
    keys[e.key] = false;
    getKeyboardUpdates();
  }
  if(e.key == 'Enter'){
    if(terminalIsOpen)runCmdFromInput();
    if(configIsOpen)applyConfigChanges();
  }
});
function keysChanged(k){
  for(let i = 0; i < k.length; i++){
    if(oldKeys[k[i]] != keys[k[i]]) return true;
  }
  return false;
}
function getKeyboardUpdates(){
  for(let w = 0; w < widgetArray.length; w++){
    if(widgetArray[w].type == '_joystick' && widgetArray[w].useKeys){
      let ck = [widgetArray[w].usekey_up,widgetArray[w].usekey_left,widgetArray[w].usekey_down,widgetArray[w].usekey_right];
      if(keysChanged(ck)){
        let dat = {x:0,y:0};
        if(keys[ck[0]]) dat.y += -1;
        if(keys[ck[1]]) dat.x += -1;
        if(keys[ck[2]]) dat.y += 1;
        if(keys[ck[3]]) dat.x += 1;
        drawJoystick(document.getElementById(widgetArray[w].id).querySelector('#canvas_ap'),dat.x,dat.y,false);
      }
    }
    if(widgetArray[w].type == '_button' && widgetArray[w].useKeys){
      let ck = [widgetArray[w].usekey_hotkey];
      if(keysChanged(ck)){
        let ele = document.getElementById(widgetArray[w].id).querySelector('#button_ap');
        if(keys[ck[0]]){
          triggerMouseEvent(ele,'mousedown');
          ele.className += " button_apPressed";
        }
        else{
          triggerMouseEvent(ele,'mouseup');
          ele.className = ele.className.replace(" button_apPressed", "");
        }
      }
    }
    if(widgetArray[w].type == '_checkbox' && widgetArray[w].useKeys){
      let ck = [widgetArray[w].usekey_hotkey];
      if(keysChanged(ck)){
        let ele = document.getElementById(widgetArray[w].id).querySelector('#checkbox_ap');
        if(keys[ck[0]]){
          ele.checked = !ele.checked;
          sendToRos(widgetArray[w].topic,{value:ele.checked ? widgetArray[w].onPress : widgetArray[w].onRelease},widgetArray[w].type);
        }
      }
    }
  if(widgetArray[w].type == '_mic' && widgetArray[w].useKeys){
      let ck = [widgetArray[w].usekey_hotkey];
      if(keysChanged(ck)){
        let ele = document.getElementById(widgetArray[w].id).querySelector('#mic_ap');
        if(keys[ck[0]]) ele.toggle();
      }
    }
  if(widgetArray[w].type == '_speaker' && widgetArray[w].useKeys){
      let ck = [widgetArray[w].usekey_hotkey];
      if(keysChanged(ck)){
        let ele = document.getElementById(widgetArray[w].id).querySelector('#speaker_ap');
        if(keys[ck[0]]) ele.toggle();
      }
    }
    if(widgetArray[w].type == '_slider' && widgetArray[w].useKeys){
      let ck = [widgetArray[w].usekey_Increase,widgetArray[w].usekey_Decrease];
      if(keysChanged(ck)){
        let dat = 0;
        if(keys[ck[0]]){
      if(inc)clearInterval(inc);
      inc = setInterval(move,parseInt(widgetArray[w].repeatdelay));
      dat=Number(widgetArray[w].step);
      move();
    }
        else if(keys[ck[1]]){
      if(inc)clearInterval(inc);
      inc = setInterval(move,parseInt(widgetArray[w].repeatdelay));
      dat=-Number(widgetArray[w].step);
      move();
    }
    else if(inc)clearInterval(inc);
    function move(){
      let v = Number(document.getElementById(widgetArray[w].id).querySelector('#slider_ap').value);
      v += dat;
      document.getElementById(widgetArray[w].id).querySelector('#slider_ap').value = v;
      sendToRos(widgetArray[w]['topic'],{
        value:setSliderDirection(v>widgetArray[w].max?widgetArray[w].max:(v<widgetArray[w].min?widgetArray[w].min:v),widgetArray[w])
      },widgetArray[w]['type']);
    }
      }
    }
  }
}

//arr max=slider max
//min = slider min
//reverse = bool flip or not
function setSliderDirection(value,arr){
  if(arr['reverse']){
    return parseFloat(arr['max'])+parseFloat(arr['min'])-parseFloat(value);
  }
  else{
    return value;
  }
}

let gamepad_index = 0;
//================= GAMEPAD INTERFACING ============================
window.addEventListener("gamepadconnected", function(e) {
  if(gamepadCount == 0) document.getElementById('gpselect').innerHTML = '';
  gamepadCount++;
  console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",e.gamepad.index, e.gamepad.id,e.gamepad.buttons.length, e.gamepad.axes.length);
  addGamepadToSelect(e.gamepad.index,e.gamepad.id);
  currentGamepad = e.gamepad;
  oldGamepad = currentGamepad;
  if(readGamepadInterval) clearInterval(readGamepadInterval);
  readGamepadInterval = setInterval(readGamepadLoop,30);
});
window.addEventListener("gamepaddisconnected", function(e) {
  clearInterval(readGamepadInterval);
  gamepadCount--;
    console.log("Gamepad disconnected from index %d: %s",e.gamepad.index, e.gamepad.id);
    removeGamepadFromSelect(e.gamepad.index);
    if(gamepadCount == 0){
    document.getElementById('gpselect').innerHTML = '<option>No Gamepad Connected</option>';
  }else{
    readGamepadInterval = setInterval(readGamepadLoop,30);
  }
});
function addGamepadToSelect(index,id){
  document.getElementById('gpselect').innerHTML += '<option value='+index+'>'+id.substring(0,15)+'...</option>';
  document.getElementById('gpselect').value = index;
  gamepad_index = index;
  console.log('gamepad_index CON',gamepad_index);
}
function removeGamepadFromSelect(index){
  let ele = document.getElementById('gpselect').options;
  for(let i = 0; i < ele.length; i++){
    if(ele[i].value == index) ele[i].remove();
  }
  if(ele.length >= 1){
     document.getElementById('gpselect').value = ele[ele.length-1].value;
     gamepad_index = ele[ele.length-1].value;
  }
  console.log('gamepad_index DIS',gamepad_index);
}
document.getElementById('gpselect').addEventListener('change',()=>{
  if(document.getElementById('gpselect').value) gamepad_index = document.getElementById('gpselect').value;
  console.log('gamepad_index CNG',gamepad_index);
});
function readGamepadLoop(){
  currentGamepad = navigator.getGamepads()[gamepad_index];
  for(let i = 0; i < currentGamepad.axes.length; i++){
    if(Math.abs(currentGamepad.axes[i] - oldGamepad.axes[i]) > 0.002){
      if(configIsOpen){
        try{
          document.getElementById('replaceWithCAxis').innerText = `Paired to axis: ${lastChangedAxis}`;
        }
        catch{}
        lastChangedAxis = Math.floor(i/2);
      }
      for(let w = 0; w < widgetArray.length; w++){
        if(widgetArray[w].type == '_joystick' && widgetArray[w].useGamepad && 'useAxis' in widgetArray[w] && widgetArray[w].useAxis == Math.floor(i/2))
        drawJoystick(document.getElementById(widgetArray[w].id).querySelector('#canvas_ap'),currentGamepad.axes[widgetArray[w].useAxis*2],currentGamepad.axes[widgetArray[w].useAxis*2+1],false);
      }
    }
  }
  for(let i = 0; i < currentGamepad.buttons.length; i++){
    if(oldGamepad.buttons.length != currentGamepad.buttons.length){
      oldGamepad = currentGamepad;
    }
    if(currentGamepad.buttons[i].pressed !== oldGamepad.buttons[i].pressed){
      if(configIsOpen){
        lastChangedButton = i;
        if(document.activeElement.className.includes('gamepad')) document.activeElement.value = lastChangedButton;
        if(document.getElementById('replaceWithCButton')) document.getElementById('replaceWithCButton').innerText = `Paired to button: ${lastChangedButton}`;
      }
      else for(let w = 0; w < widgetArray.length; w++){
        if(widgetArray[w].type == '_button' && widgetArray[w].useGamepad && 'useButton' in widgetArray[w] && widgetArray[w]['useButton'] == i){
          var ele = document.getElementById(widgetArray[w].id).querySelector('#button_ap');
          if(currentGamepad.buttons[i].pressed){
            triggerMouseEvent(ele,'mousedown');
            ele.className += " button_apPressed";
          }
          else{
            triggerMouseEvent(ele,'mouseup');
            ele.className = ele.className.replace(" button_apPressed", "");
          }
        }
        if(widgetArray[w].type == '_mic' && widgetArray[w].useGamepad && 'useButton' in widgetArray[w] && widgetArray[w]['useButton'] == i){
          var ele = document.getElementById(widgetArray[w].id).querySelector('#mic_ap');
          if(currentGamepad.buttons[i].pressed){
      ele.toggle();
          }
        }
    if(widgetArray[w].type == '_speaker' && widgetArray[w].useGamepad && 'useButton' in widgetArray[w] && widgetArray[w]['useButton'] == i){
          var ele = document.getElementById(widgetArray[w].id).querySelector('#speaker_ap');
          if(currentGamepad.buttons[i].pressed){
      ele.toggle();
          }
        }
    if(widgetArray[w].type == '_checkbox' && widgetArray[w].useGamepad && 'useButton' in widgetArray[w] && widgetArray[w]['useButton'] == i){
          var ele = document.getElementById(widgetArray[w].id).querySelector('#checkbox_ap');
          if(currentGamepad.buttons[i].pressed){
            ele.checked = !ele.checked;
            sendToRos(widgetArray[w].topic,{value:ele.checked ? widgetArray[w].onPress : widgetArray[w].onRelease},widgetArray[w].type);
          }
        }
        let dat = 0;
        if(widgetArray[w].type == '_slider' && widgetArray[w].useGamepad && 'gp_Increase' in widgetArray[w] && widgetArray[w]['gp_Increase'] == i){
          var ele = document.getElementById(widgetArray[w].id).querySelector('#slider_ap');
          //check if the 'increase slider' button is pressed
          if(currentGamepad.buttons[i].pressed){
            if(inc)clearInterval(inc);
      inc = setInterval(move,parseInt(widgetArray[w].repeatdelay));
      dat=Number(widgetArray[w].step);
      move();
          }
          else{
            if(inc)clearInterval(inc);
          }
        }
        else if(widgetArray[w].type == '_slider' && widgetArray[w].useGamepad && 'gp_Decrease' in widgetArray[w] && widgetArray[w]['gp_Decrease'] == i){
          var ele = document.getElementById(widgetArray[w].id).querySelector('#slider_ap');
          //check if the 'decrease slider' button is pressed
          if(currentGamepad.buttons[i].pressed){
            if(inc)clearInterval(inc);
      inc = setInterval(move,parseInt(widgetArray[w].repeatdelay));
      dat=-Number(widgetArray[w].step);
      move();
          }
          else{
            if(inc)clearInterval(inc);
          }
        }
        function move(){
      let v = Number(document.getElementById(widgetArray[w].id).querySelector('#slider_ap').value);
      v += dat;
      document.getElementById(widgetArray[w].id).querySelector('#slider_ap').value = v;
      sendToRos(widgetArray[w]['topic'],{
        value:setSliderDirection((v>widgetArray[w].max?widgetArray[w].max:(v<widgetArray[w].min?widgetArray[w].min:v)),widgetArray[w])
      },widgetArray[w]['type']);
    }
      }
    }
  if(currentGamepad.buttons[i].value !== oldGamepad.buttons[i].value){
      if(configIsOpen){
    if(currentGamepad.buttons[i].value % 1 !== 0){
      lastChangedButton = i;
      if(document.activeElement.className.includes('gamepad')) document.activeElement.value = lastChangedButton;
      if(document.getElementById('replaceWithPButton')) document.getElementById('replaceWithPButton').innerText = `Paired to paddle: ${lastChangedButton}`;
    }
      }
      else for(let w = 0; w < widgetArray.length; w++){
        if(widgetArray[w].type == '_trigger' && widgetArray[w].useGamepad && 'useButton' in widgetArray[w] && widgetArray[w]['useButton'] == i){
          var ele = document.getElementById(widgetArray[w].id).querySelector('#paddle_ap');
      sendToRos(widgetArray[w]['topic'],{value:currentGamepad.buttons[i].value},widgetArray[w]['type']);
      
          switch(widgetArray[w].edge){
      case 'Right':
        ele.style.right = '0px';
        ele.style.left = 'unset';
        ele.style.top = '22px';
        ele.style.bottom = 'unset';
        ele.style.width = (currentGamepad.buttons[i].value*100)+'%';
        ele.style.height = 'calc(100% - 22px)';
        break;

      case 'Top':
        ele.style.left = '0px';
        ele.style.top = '22px';
        ele.style.bottom = 'unset';
        ele.style.right = 'unset';
        ele.style.height = 'calc('+currentGamepad.buttons[i].value*100 + '% - 22px)';
        ele.style.width = '100%';
        break;
          
      case 'Bottom':
        ele.style.left = '0px';
        ele.style.bottom = '0px';
        ele.style.top = 'unset';
        ele.style.right = 'unset';
        ele.style.width = '100%';
        ele.style.height = 'calc('+currentGamepad.buttons[i].value*100 + '% - 22px)';
        break;
          
        default: //case: Left
        ele.style.left = '0px';
        ele.style.right = 'unset';
        ele.style.top = '22px';
        ele.style.bottom = 'unset';
        ele.style.height = 'calc(100% - 22px)';
        ele.style.width = (currentGamepad.buttons[i].value*100)+'%';
        break;
      }
    }
    }
  }
  }
  oldGamepad = currentGamepad;
}
function triggerMouseEvent(node, eventType) {
    var clickEvent = document.createEvent ('MouseEvents');
    clickEvent.initEvent (eventType, true, true);
    node.dispatchEvent (clickEvent);
}

//DRIVE MODE
function toggleDriveMode(){
  if(this.inDriveMode){
    this.inDriveMode = false; //going into edit mode
    let dm = document.getElementById('driveMode');
    dm.innerText = 'Drive';
  //show all widgets
  for(let i = 0; i < widgetArray.length; i++){
    let ele = document.getElementById(widgetArray[i].id);
    ele.style.visibility = 'visible';
    if(widgetArray[i].type == '_rosImage'){
      console.log('okok');
      set4style(ele,widgetArray[i]);
    }
  }
    document.getElementsByClassName('toggleWidgetHolder')[0].style.visibility='visible';
  }else{
    this.inDriveMode = true; //going into drive mode
    let dm = document.getElementById('driveMode');
    dm.innerText = 'Edit';
    hideWidgetHolder();
  //hide all widgets
  for(let i = 0; i < widgetArray.length; i++){
    let ele = document.getElementById(widgetArray[i].id);
    ele.style.visibility = 'hidden';
    if(widgetArray[i].type == '_rosImage'){
      console.log('jokes');
      set4style(ele,widgetArray[i]);
    }
  }

    document.getElementsByClassName('toggleWidgetHolder')[0].style.visibility='hidden';
  }
}

function hideWidgetHolder(){
  let me = document.getElementsByClassName('toggleWidgetHolder')[0];
  document.getElementById('widgetHolder').style.left = '-260px';
  widgetHolderOpen = false;
  me.style.left = '5px';
  me.innerText = 'Show';
}
function showWidgetHolder(){
  let me = document.getElementsByClassName('toggleWidgetHolder')[0];
  document.getElementById('widgetHolder').style.left = '0px';
  widgetHolderOpen = true;
  me.style.left = '192px';
  me.innerText = 'Hide';
}
function toggleWidgetHolder(){
  if(!this.inDriveMode){
    if(widgetHolderOpen){
      hideWidgetHolder();
    }
    else{
      showWidgetHolder();
    }
  }
}

//align small previews of image to left side of main image
function repositionThumbs(){
  let tileArray = document.getElementsByClassName('imageTile');
  let x = document.getElementById('mainImage').getBoundingClientRect().x;
  if(x < 0) x = 0;
  for(let i =0; i< tileArray.length; i++){
    tileArray[i].style.left = parseInt(x + i*(THUMBWIDTH+15)+5) + 'px';
  }
}
window.onresize = function(){
  repositionThumbs();

  //hide some things if the screen is to slim
  if(window.innerWidth < 1500) document.getElementById('consoleText').style.visibility = 'hidden';
  else document.getElementById('consoleText').style.visibility = 'visible';

  if(window.innerWidth < 1344) document.getElementById('closeOtherSockets').style.display = 'none';
  else document.getElementById('closeOtherSockets').style.display = 'inline';
  
  //center image if it is supposed to be centered
  for(let i = 0; i < widgetArray.length;i++){
    let WA = widgetArray[i];
    if(WA.type == '_rosImage'){
      let tile = document.getElementById(WA.id);
      set4style(tile,WA);
    }
  }
}

function playSound(s){
  if(sounds[s]) new Audio('sounds/'+sounds[s]).play();
}
function submitDropdownChange(t){
  let WA = widgetArray[indexMap[t.parentElement.id]];
  sendToRos(WA['topic'],{value:t.value},'_dropdown');
}
//opts = bool mode, value
function formatNumber(data,opts){
  if(Number(data)){
    if(opts.formatmode==0) return Number(data).toFixed(parseInt(opts.formatvalue));
    if(opts.formatmode==1) return Number(data).toPrecision(parseInt(opts.formatvalue));
    if(opts.formatmode==2) return Number(data);
  }
  return data;
}

// View in fullscreen
function openFullscreen() {
  let elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
}

// Close fullscreen
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

//toggle window fullscreen
function toggleFullscreen(){
  if(fullScreen) closeFullscreen();
  else openFullscreen();
  fullScreen = !fullScreen;
}

//mobile view support
function preventBehavior(e) {
    e.preventDefault();
}
 
 **/
