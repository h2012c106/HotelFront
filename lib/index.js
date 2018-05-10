'use strict';

let ctx = document.getElementById("myChart").getContext('2d');

let chartInitParam = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'A',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 0.2)',
            fill: true
        }]
    },
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'Chart.js Line Chart'
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
                    labelString: 'Month'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
                }
            }]
        }
    }
};

let myChart = new Chart(ctx, chartInitParam);


let dataAccept = function (data) {
    myChart.data.labels.push(moment().format('HH:mm:ss'));
    myChart.data.datasets.forEach(function (dataset) {
        dataset.data.push(data);
    });
    myChart.update();
};

