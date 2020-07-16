require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ngrok = require('ngrok');
const app = express();
const port = process.env.NGROK_PORT;
const request = require('request');

const pelion_api_key = process.env.PELION_API_KEY;
const pelion_device_id = process.env.PELION_DEVICE_ID;
const pelion_base_uri = process.env.PELION_BASE_URI;
var pelion_resource_uri = process.env.PELION_RESOURCE_ID;

app.use(bodyParser.json())

function http_request(method, url, body, cb) {
	var options = {
		'method': method,
		'url': pelion_base_uri + url,
		'headers': {
			'Authorization': 'Bearer ' + pelion_api_key,
			'Content-Type': 'application/json'
		}
	};
	if (body != null)
		options.body = body;

	request(options, function (error, response) {
		if (error) throw new Error(error);
		if (response.statusCode < 200 || response.statusCode > 204) {
			console.log('HTTP request returned code: ' + response.statusCode);
			console.log('HTTP request returned body: ' + JSON.stringify(response.body));
		}
		this();
	}.bind(cb));
}

function pelion_callback(ngrok_url, cb) {
	http_request('PUT', '/v2/notification/callback', JSON.stringify({"url":ngrok_url}), cb);
}

function pelion_subscribe(device_id, resource_uri, cb) {
	http_request('PUT', '/v2/subscriptions/' + pelion_device_id + resource_uri, null, cb);
}

function pelion_notification_rule(device_id, resource_uri, cb) {
	var async_id = '123e4567-e89b-12d3-a456-426655440000';
	http_request('POST',
				 '/v2/device-requests/' + pelion_device_id + '?async-id=' + async_id,
				 JSON.stringify({
				 	'method': 'PUT',
				 	'uri': resource_uri + '?pmax=10'
				 }),
				 cb);
}

const ngrok_startup = async function() {

	var url = await ngrok.connect({
		proto: 'http',
		addr: 9999,
		region: 'us',
	});

	url = url.replace('https','http') + '/webhook';

	console.log(`ngrok server started with url: ${url}`);

	app.listen(port, function() {
		console.log(`ngrok forwarding to http://localhost:${port}`);

		pelion_callback(this, function() {
			pelion_subscribe(pelion_device_id, pelion_resource_uri, function() {

			});
			pelion_notification_rule(pelion_device_id, pelion_resource_uri, function() {

			});
		});

	}.bind(url));
};

app.put("/webhook", (req, res) => {
	res.status(200).end();

	if ('notifications' in req.body) {
		var notifications = req.body.notifications;
		for (var noti in notifications) {
			if (notifications[noti].path == pelion_resource_uri && notifications[noti].payload) {
				let buff = new Buffer(notifications[noti].payload, 'base64');
				console.log('Notification: ' + buff.toString('ascii'));
			} else {
				console.log('Notification with id ' + responses[resp].id + ' had error code ' + responses[resp].status);
			}
		}
	}

	if ('async-responses' in req.body) {
		var responses = req.body['async-responses'];
		for (var resp in responses) {
			if (responses[resp].status == 200 && responses[resp].payload) {
				let buff = new Buffer(responses[resp].payload, 'base64');
				console.log('Async response: ' + buff.toString('ascii'));
			} else {
				console.log('Async-response with id ' + responses[resp].id + ' had error code ' + responses[resp].status);
			}
		}
	}
})

ngrok_startup();