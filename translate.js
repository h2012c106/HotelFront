const command = require('commander');
const net = require('net');
const app = require('http').createServer()
const clientPort = require('socket.io')(app);

command
    .version('0.0.1')
    .option('-h, --serverHost [value]', 'server\'s host')
    .option('-s, --serverPort [value]', 'server\'s port')
    .option('-c, --clientPort [value]', 'client\'s port')
    .parse(process.argv);

const SERVER = command.serverPort;
const CLIENT = command.clientPort;

app.listen(CLIENT);

let serverPort = net.createConnection(SERVER, command.serverHost);

clientPort.on('connection', function (socket) {
	console.log('Client Connection Come');
	socket.on('clientEvent', function (data) {
		serverPort.write(data);
		console.log(`C2S: ${data}`);
	});
	socket
});

serverPort.on('connect', function () {
	console.log('Server Connection Done');
	serverPort.on('data', function (data) {
		clientPort.emit('serviceEvent', data.toString());
		console.log(`S2C: ${data.toString()}`);
	});
});