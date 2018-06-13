'use strict';

let myChart;

let windToFan = {
	0: 'Fan',
	1: 'Low',
	2: 'Normal',
	3: 'High'
};

let event = new EventEmitter();
event.defineEvents(['roomChange']);

let defaultInsertion = '-';
let defaultCanvas = `<p class="noCanvas">No Room Chosen</p>`;

function adjustRoomList(rooms) {
	$('ul#roomList').html(function () {
		let roomList = rooms.map(function (room) {
			return `<li><a class="roomItem" data-roomNo="${room}">${room}</a></li>`;
		});
		roomList = roomList.join('');
		return roomList;
	});
	$('a.roomItem').click(function () {
		event.emit('roomChange', $(this).data('roomno'));
	});
}

function recoverForm() {
	let acMode = Number(moment().format('MM')) <= 6 ? 'cool' : 'hot';
	$('table.ctrlPad h3#mode').text(acMode);

	$('h1.rawInfo').text(defaultInsertion);
	$('h3.ctrlName.value').not('#mode').text(defaultInsertion);
	$('div.canvasHouse').html(defaultCanvas);
}

function updateChart(newcrtTemp, newtgtTemp, chart) {
	console.log(newcrtTemp, newtgtTemp);
	chart.data.labels.push(moment().format('HH:mm:ss'));
	chart.data.datasets[0].data.push(newcrtTemp);
	chart.data.datasets[1].data.push(newtgtTemp);
	chart.update();
}

function createChart(newcrtTemp, newtgtTemp) {
	$('div.canvasHouse').html(`<canvas id="chart"></canvas>`);

	let ctx = document.getElementById('chart').getContext('2d');

	let chartInitParam = {
		type: 'line',
		data: {
			labels: [],
			datasets: [{
				label: 'Current Temperature',
				data: [newcrtTemp],
				backgroundColor: 'rgba(220, 220, 220, 0.5)',
				borderColor: '#f56a6a',
				fill: false,
			}, {
				label: 'Set Temperature',
				data: [newtgtTemp],
				backgroundColor: 'rgba(220, 220, 220, 0.5)',
				borderColor: '#69cbf5',
				fill: false,
			}]
		},
		options: {
			responsive: true,
			title: {
				display: true,
				text: 'Temperature Tendency Chart',
				fontSize: 20
			},
			tooltips: {
				mode: 'index',
				intersect: false,
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				xAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Time / HH:mm:ss'
					}
				}],
				yAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Temperature / °C'
					}
				}]
			}
		}
	};

	return new Chart(ctx, chartInitParam);
}

function refreshForm(currentRoom, pwd, tgtTemp, wind, crtTemp, cost) {
	$('h3.ctrlName.value#room').text(currentRoom);
	$('h3.ctrlName.value#acPower').text(pwd);
	$('h3.ctrlName.value#acTemp').text(tgtTemp);
	$('h3.ctrlName.value#fanCtrl').text(wind);
	$('div#cost h1.rawInfo').text(cost);
	$('div#currentTemp h1.rawInfo').text(crtTemp);
}

$(document).ready(function () {
	recoverForm();
});


let socket = io('http://127.0.0.1:4399');

socket.on('connect', function () {
	let room = '';
	setInterval(function () {
		let info = `-1,${room}`;
		socket.emit('clientEvent', info);
	}, 5000);

	event.on('roomChange', function (newRoom) {
		socket.emit('clientEvent', `-1,${newRoom}`);
	});

	socket.on('serviceEvent', function (data) {
		data = JSON.parse(data);

		let rooms = data.rooms;
		adjustRoomList(rooms);

		let tmpRoomInfo = data.roomInfo;
		if (tmpRoomInfo) {
			let currentRoom = tmpRoomInfo.room;
			let pwd = tmpRoomInfo.switch === 0 ? 'Off' : 'On';
			let tgtTemp = tmpRoomInfo.tgtTemperature;
			let wind = windToFan[tmpRoomInfo.wind];
			let crtTemp = tmpRoomInfo.crtTemperature;
			let cost = tmpRoomInfo.cost;
			if (room === currentRoom) {
				updateChart(crtTemp, tgtTemp, myChart);
				refreshForm(currentRoom, pwd, tgtTemp, wind, crtTemp, cost);
			}
			else {
				myChart = createChart(crtTemp, tgtTemp);
				refreshForm(currentRoom, pwd, tgtTemp, wind, crtTemp, cost);
				room = currentRoom;
			}
		}
		else {
			if (room) {
				room = '';
				recoverForm();
			}
		}
	});
});