'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const createRoomAndUpdateOnStateChange = helpers.createRoomAndUpdateOnStateChange;
const connectOrDisconnect = document.querySelector('input#connectordisconnect');
const mediaContainer = document.getElementById('remote-media');
let roomName = null;
let room = null;
let someRoom = null;


/**
 * Connect the Participant with media to the Room.
 */
async function connectToRoom() {
  console.log("connectToRoom start");
  const creds = await getRoomCredentials();
  room = await Video.connect( creds.token, {
    name: roomName
  });
  connectOrDisconnect.value = 'Disconnect from Room';
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom() {
  room.disconnect();
  room = null;
  connectOrDisconnect.value = 'Connect to Room';
  return;
}

function connectToOrDisconnectFromRoom(event) {
  event.preventDefault();
  return room ? disconnectFromRoom() : connectToRoom();
}

/**
 * Get the Tracks of the given Participant.
 */
function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(function(publication) {
    return publication.track;
  }).map(function(publication) {
    return publication.track;
  });
}

/**
 * Get the Tracks of the given Participant.
 */
let lastRoomState = "unknown";
function onRoomStateChange(newState) {
  console.log("StateChange: ", newState);

  const oldStateBtn = document.getElementById("roomstate-" + lastRoomState);
  oldStateBtn.classList.remove('current');

  lastRoomState = someRoom.state;
  const newStateBtn = document.getElementById("roomstate-" + someRoom.state);
  newStateBtn.classList.add('current');
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Get the credentials to connect to the Room.
  const creds = await getRoomCredentials();

  // Connect to a random Room with no media. This Participant will
  // display the media of the other Participants that will enter
  // the Room and watch for dominant speaker updates.
  someRoom = await createRoomAndUpdateOnStateChange(creds.token, onRoomStateChange);
  onRoomStateChange();

  console.log("makarand: created room!", someRoom.name);

  // Set the name of the Room to which the Participant that shares
  // media should join.
  roomName = someRoom.name;

  // set listener to connect new users to the room.
  connectOrDisconnect.style.display = 'block';
  connectOrDisconnect.onclick = connectToOrDisconnectFromRoom;

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    someRoom.disconnect();
  };

  someRoom.on('participantConnected', function(participant) {
    console.log("participantConnected: ", participant);
    // const div = document.createElement('div');
    // div.id = participant.sid;
    // mediaContainer.appendChild(div);
    participant.on('trackSubscribed', function(track) {
      mediaContainer.appendChild(track.attach());
    });
  });

  someRoom.on('participantDisconnected', function(participant) {
    getTracks(participant).forEach(function(track) {
      track.detach().forEach(function(element) {
        element.remove();
      });
    });
    const participantDiv = document.getElementById(participant.sid);
    participantDiv.parentNode.removeChild(participantDiv);
  });
}());
