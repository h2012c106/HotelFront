'use strict';

$("#acPower").bootstrapSwitch({
	onText: 'On',
	offText: 'Off'
});

$('#acTemp').bootstrapSlider({
	id: 'acTempSlider',
	min: 16,
	max: 32,
	value: 26,
	tooltip: 'show',
	formatter: function (value) {
		return value + '°C';
	}
});