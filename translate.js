const net = require("net");
const app = require('http').createServer()
const clientPort = require('socket.io')(app);

const SERVER = 8080;
const CLIENT = 8888;

app.listen(CLIENT);

let serverPort = net.createConnection(SERVER, '192.168.137.1');

clientPort.on('connection', function (socket) {
	console.log('Client Connection Come');
	socket.on('clientEvent', function (data) {
		serverPort.write(data);
		console.log(`C2S: ${data}`);
	});
});

serverPort.on('connect', function () {
	console.log('Server Connection Done');
	serverPort.on('data', function (data) {
		clientPort.emit('serviceEvent', data.toString());
		console.log(`S2C: ${data.toString()}`);
	});
});