# Pelion Server

Example NodeJS script to stream client data via webhook

## Pre-Requisites

* NodeJS
* NPM (comes with nodejs traditionally)
* Pelion API Key
* Device ID that you want to inspect

## Setup

```
git clone git@github.com:mray190/pelion-server.git
cd pelion-server
npm i
```

Additionally, create a file called `.env` and place the following in the file:
```
PELION_API_KEY=<api-key>
PELION_DEVICE_ID=<device-id>
PELION_BASE_URI=https://api.us-east-1.mbedcloud.com
NGROK_PORT=9999
PELION_RESOURCE_ID=/3/0/3320
```
Replace `<api-key>` and `<device-id>` with the appropriate values

## Running

Run the command:
```
node index.js
```
