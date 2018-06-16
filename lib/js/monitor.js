'use strict';

let myLine;
let myDoughnut;

let windToFan = {
	0: 'Fan',
	1: 'Low',
	2: 'Normal',
	3: 'High'
};

let charmingColor = [
	'#999999',
	'#f56a6a',
	'#69cbf5',
	'#edd1d8',
	'#88ada6',
	'#ffc773',
	'#7bcfa6',
	'#f36838',
	'#4c8dae',
	'#cca4e3'
];
let colorCanUse = JSON.parse(JSON.stringify(charmingColor));

let socket = io('http://127.0.0.1:4399');

let event = new EventEmitter();
event.defineEvents(['roomChange']);

let defaultInsertion = '-';
let defaultCanvas = `<p class="noCanvas">No Room Chosen</p>`;

myDoughnut = new Chart(document.getElementById('doughnut').getContext('2d'), {
	type: 'doughnut',
	data: {
		datasets: [{
			data: [],
			backgroundColor: []
		}],
		labels: []
	},
	options: {
		responsive: true,
		legend: {
			position: 'top',
		},
		title: {
			display: true,
			text: 'Rooms\' Income Chart',
			fontSize: 20
		},
		animation: {
			animateScale: true,
			animateRotate: true
		}
	}
});

function pickRandColor() {
	let colorLen = colorCanUse.length;
	let res;

	if (colorLen === 0) {
		res = '#000000';
	} else {
		let tmpRand = Math.floor(Math.random() * colorLen);
		res = colorCanUse[tmpRand];
		colorCanUse.splice(tmpRand, 1);
	}
	return res;
}

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
	$('div.canvasHouse').html(`<canvas id="line"></canvas>`);

	let ctx = document.getElementById('line').getContext('2d');

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

socket.on('connect', function () {
	let room = '';
	setInterval(function () {
		let info = `-1,${room}`;
		socket.emit('clientEvent', info);
	}, 5000);
	setInterval(function () {
		let info = '-2';
		socket.emit('clientEvent', info);
	}, 10000);

	event.on('roomChange', function (newRoom) {
		socket.emit('clientEvent', `-1,${newRoom}`);
	});

	socket.on('serviceEvent', function (data) {
		data = JSON.parse(data);

		if (data.type === -1) {
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
					updateChart(crtTemp, tgtTemp, myLine);
					refreshForm(currentRoom, pwd, tgtTemp, wind, crtTemp, cost);
				}
				else {
					myLine = createChart(crtTemp, tgtTemp);
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
		} else if (data.type === -2) {
			let roomsInfo = data.details;

			for (let room in roomsInfo) {
				let tmpPos = myDoughnut.data.labels.indexOf(room);
				if (tmpPos === -1) {
					myDoughnut.data.labels.push(room);
					myDoughnut.data.datasets.forEach(function (dataset) {
						dataset.data.push(roomsInfo[room]);
						dataset.backgroundColor.push(pickRandColor());
					});
				} else {
					myDoughnut.data.datasets.forEach(function (dataset) {
						dataset.data[tmpPos] = roomsInfo[room];
					});
				}
			}
			myDoughnut.update();
		}
	});
});