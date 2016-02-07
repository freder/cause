'use strict';

const io = require('socket.io-client');
const config = require('./config.js');


const socket = io('http://localhost:' + config.server.websocket_port);

socket.on('connect', function() {
	console.log('connect');
});
