'use strict';

/***********************
 *
 * Init the chart
 *
 ***********************/


let ctx = document.getElementById('chart').getContext('2d');

let chartInitParam = {
	type: 'line',
	data: {
		labels: [],
		datasets: [{
			label: '',
			data: [],
			backgroundColor: 'rgba(220, 220, 220, 0.5)',
			borderColor: '#f56a6a',
			fill: true,
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

let myChart = new Chart(ctx, chartInitParam);

/***********************
 *
 * Define events listener
 *
 ***********************/

let event = new EventEmitter();
event.defineEvents(['controlOrder']);

/***********************
 *
 * Connection, and web I/O
 *
 ***********************/

function changeCostByJson(newCost) {
	$('div#cost h1.rawInfo').text(newCost);
}

let socket = io('http://127.0.0.1:8888');

socket.on('connect', function () {
	setInterval(function () {
		let info = {
			type: 1,
			temperature: $('div#currentTemp h1.rawInfo').text()
		};
		socket.emit('clientEvent', JSON.stringify(info));
	}, 1000);

	event.on('controlOrder', function (controlStr) {
		socket.emit('clientEvent', controlStr);
	});

	socket.on('serviceEvent', function (data) {
		data = JSON.parse(data);
		let cost = data.cost;
		changeCostByJson(cost);
	});
});

/***********************
 *
 * Update temperature
 *
 ***********************/

let interval = 1000;
let tempSpeed = 0.1;
let maxTemp = 27;
let spdToTemp = {
	'SongFeng': -0.1,
	'Normal': 0.1,
	'High': 0.2
};

$('div#currentTemp h1.rawInfo').text(`${maxTemp}°C`);

function updateChart(newTemp) {
	myChart.data.labels.push(moment().format('HH:mm:ss'));
	myChart.data.datasets.forEach(function (dataset) {
		dataset.data.push(newTemp);
	});
	myChart.update();
}

setInterval(function () {
	$('div#currentTemp h1.rawInfo').text(function (index, oriText) {
		let pwd = $('#acPower').data('bootstrap-switch').options.state;
		if (pwd) {
			let setTemp = Number($('#acTemp').bootstrapSlider('getValue'));
			let fanSpd = $('input[type="radio"]:checked').data('gear');
			let tempSpeed = spdToTemp[fanSpd];

			oriText = oriText.replace(/[^0-9\.]+/g, '');
			let newTest = Number((Number(oriText) - tempSpeed * interval / 1000).toFixed(1));

			let newTemp;
			if (fanSpd === 'SongFeng') {
				newTemp = Math.min(maxTemp, newTest);
			}
			else {
				newTemp = Math.max(setTemp, newTest);
			}
			updateChart(newTemp);
			newTest = String(newTemp) + '°C';
			return newTest;
		}
		else {
			oriText = oriText.replace(/[^0-9\.]+/g, '');
			let newTest = Number((Number(oriText) + tempSpeed * interval / 1000).toFixed(1));
			let newTemp = Math.min(maxTemp, newTest);
			updateChart(newTemp);
			newTest = String(newTemp) + '°C';
			return newTest;
		}
	});
}, interval);


/***********************
 *
 * When the AC control bar change, emit json out event
 *
 ***********************/
let eventList = [{
	event: 'check in',
	timestamp: moment().format('x')
}];

function getAcOptions() {
	let pwd = $('#acPower').data('bootstrap-switch').options.state;
	let temp = $('#acTemp').bootstrapSlider('getValue');
	let fanSpd = $('input[type="radio"]:checked').data('gear');

	return {
		type: 0,
		room: undefined,
		switch: pwd,
		temperature: temp,
		wind: fanSpd
	};
}

$('#acPower').on('switchChange.bootstrapSwitch', function () {
	let tmpCtrl = getAcOptions();
	let tmpStr = JSON.stringify(tmpCtrl);
	event.emit('controlOrder', tmpStr);
	eventList.push({
		event: tmpCtrl.switch ? 'switch on' : 'switch off',
		timestamp: moment().format('x')
	});
});

$('#acTemp').on('slideStop', function () {
	let tmpCtrl = getAcOptions();
	let tmpStr = JSON.stringify(tmpCtrl);
	event.emit('controlOrder', tmpStr);
	eventList.push({
		event: `change to ${tmpCtrl.temperature}°C`,
		timestamp: moment().format('x')
	});
});

$('input[type="radio"]').change(function () {
	let tmpCtrl = getAcOptions();
	let tmpStr = JSON.stringify(tmpCtrl);
	event.emit('controlOrder', tmpStr);
	eventList.push({
		event: `gear to ${tmpCtrl.wind}`,
		timestamp: moment().format('x')
	});
});


/***********************
 *
 * Need checkout
 *
 ***********************/

$('a#checkoutBtn').click(function () {
	/************
	 * json with two key
	 *      history <list>: event and its timestamp
	 *      cost <float>: cost
	 *
	 * @TODO
	 ************/
	eventList.push({
		event: 'check out',
		timestamp: moment().format('x')
	});

	let checkOutInfo = {
		history: eventList,
		cost: Number($('div#cost h1.rawInfo').text())
	};

	let history = JSON.parse(JSON.stringify(checkOutInfo.history));

	console.log(history)

	history.sort(function (x, y) {
		return x.timestamp - y.timestamp;
	});

	let msgHead = `<div class="table-wrapper"><table class="alt"><thead><tr> <th>Time</th><th>Event</th> </tr></thead><tbody>`;
	let msgBody = '';
	let msgTail = `</tbody></table></div>`;

	history.forEach(function (item) {
		msgBody += `<tr><td>${moment(item.timestamp, 'x').format('YYYY-MM-DD HH:mm:ss')}</td><td>${item.event}</td></tr>`;
	});

	let msg = msgHead + msgBody + msgTail;

	msg += `<div class="totPrice"><h4 class="rawInfo">Total Price:</h4>￥ ${checkOutInfo.cost}</div>`;

	BootstrapDialog.show({
		type: BootstrapDialog.TYPE_DEFAULT,
		title: 'Usage Detail',
		message: msg,
		buttons: [{
			label: 'Pay and Leave',
			cssClass: 'dialogBtn',
			action: function () {
				window.location.href = 'http://flappybird.io/';
			}
		}, {
			label: 'Cancel',
			cssClass: 'dialogBtn',
			action: function (dialogItself) {
				eventList.pop();
				dialogItself.close();
			}
		}],
		closable: false
	});
});