const net = require("net");
const app = require('http').createServer()
const clientPort = require('socket.io')(app);

const SERVER = 8080;
const CLIENT = 8888;

app.listen(CLIENT);

let serverPort = net.createConnection(SERVER, '127.0.0.1');


clientPort.on('connection', function (socket) {
	socket.on('clientEvent', function (data) {
		serverPort.write(data);
		console.log(data);
	});
});

serverPort.on('connect', function () {
	serverPort.on('data', function (data) {
		clientPort.emit('serviceEvent', data.toString());
		console.log(data.toString());
	});
});