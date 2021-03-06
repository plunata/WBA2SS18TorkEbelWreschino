// require modules
const express = require("express");
const http = require("http");
const faye = require('faye');
const bodyParser = require('body-parser')
const async = require("async");

// server settings
const app = express();
var server = http.createServer(app);
var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});

bayeux.attach(server);

var faye_client = bayeux.getClient();

global.serverSettings = {
	host: "https://wba2ss18.herokuapp.com",
//	host: "https://localhost/",
	port: process.env.PORT || 8080
}
// bodyparser for json being able to read
app.use(bodyParser.json())

// load scripts from all resources
var games = require('./games/index.js');
var groups = require('./groups/index.js');
var events = require('./events/index.js');
var users = require('./users/index.js');

app.use("/games", games.router);
app.use("/groups", groups.router);
app.use("/events", events.router);
app.use("/users", users.router);

setInterval(function() {
	for(let i = 0; i < allEvents.length; i++) {
		if(allEvents[i].tags.length > 0) {
			for(let j = 0; j < allEvents[i].tags.length; j++) {
				faye_client.publish('/events/' + allEvents[i].game + '/' + allEvents[i].tags[j] , {
					text : 'Event reminder !',
					event : allEvents[i]
				});
			}
		}
	}
}, 10000);

// Load Databases sync
async.waterfall([

	// load groups Data
	function(callback) {
		groups.loadData(callback);
	},
	// if there is an error quit. else load events Data
	function (err, callback) {
		if(err != null){
			callback(err + " - groups", false);
		}
		else {
			events.loadData(callback);
		}
	},
	// if there is an error quit. else load user Data
	function (err, callback){
		if(err != null) {
			callback(err + " - events", false);
		}
		else {
			users.loadData(callback);
		}
	},
	// if there is an error quit.
	function (err, callback){
		if(err != null) {
			callback(err + " - users", false);
		}
		else {
			callback(null, true);
		}
	},
], function(err, success) {
	console.log("Database " + (success? "successfully loaded." : "failed loading. - " + err ));
	

// Server Start
	server.listen(serverSettings.port, function() {
		console.log("App listening at %s:%s", serverSettings.host, serverSettings.port);
	});
});

// called when server is shut down
function onExit(){
	
	async.waterfall([
		// saves groups Data
		function(callback){
			groups.saveData(callback);
		},
		// if there was an error -> quit. else save events
		function (err, callback) {
			if(err != null){
				callback(err + " - groups", false);
			}
			else {
				events.saveData(callback);
			}
		},
		// if there was an error -> quit. else save users
		function (err, callback){
			if(err != null){
				callback(err + " - events", false);
			}
			else {
				users.saveData(callback);
			}
		},
		// if there was an error loading users -> quit
		function (err, callback){
			if(err != null){
				callback(err + " - users", false);
			}
			else {
				callback(null, true);
			}
		},
	], function(err, success) {
		// close server
		console.log("Database " + (success? "successfully saved." : "failed saving. - " + err ));
		
		console.log("Server Shutdown");
		process.exit();
	});
}

// Server Sutdown
process.on("SIGINT", onExit);