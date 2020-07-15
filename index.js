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
		if (response.statusCode != 200 && response.statusCode != 204) {
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

		//Subscribe to devices from Pelion
		pelion_subscribe(pelion_device_id, pelion_resource_uri, function() {
			pelion_callback(this, function() {});
		}.bind(this));
	}.bind(url));
};

app.put("/webhook", (req, res) => {
	res.status(200).end();

	if ('notifications' in req.body) {
		var notifications = req.body.notifications;
		for (var noti in notifications) {
			if (notifications[noti].path == pelion_resource_uri) {
				let buff = new Buffer(notifications[noti].payload, 'base64');
				console.log(buff.toString('ascii'));
			}
		}
	}
})

ngrok_startup();