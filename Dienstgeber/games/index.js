const igdb = require('igdb-api-node').default;

const client = igdb('c1670ab9380e5f235375e32351daff78'),
    log = response => {
        console.log(response.url, JSON.stringify(response.body, null, 2));
    };

const express = require("express");
const bodyParser = require('body-parser');
const fs = require("fs");
const request = require('request');

const router = express.Router();

const db_path = "/igdb_games.json";
const gameDataJson = "/igdb_games.json";


var gameData;

/**************************
 * REST API
**************************/

router.get('/', function(req, res){

    client.games({
        fields: '*', // Return all fields
        limit: 5, // Limit to 5 results
        offset: 15 // Index offset for results
    }).then(gameData => {
        res.status(200).json(gameData.body);
    }).catch(error => {
        res.status(401).send("Fehler: " + error);
    });
    
});

router.get('/filtertest', function(req, res) {

    /*
    Search for up to two Atari platforms and return their names
    */
    client.platforms({
        limit: 2,
        search: 'PlayStation'
    }, [
        'name'
    ]).then(log);

    /*
    Search for up to five Zelda games with release dates between 1 Jan and
    31 Dec 2011, sorted by release date in descending order.
    */
    client.games({
        filters: {
            'release_dates.date-gt': '2010-12-31',
            'release_dates.date-lt': '2012-01-01'
        },
        limit: 5,
        offset: 0,
        order: 'release_dates.date:desc',
        search: 'final fantasy'
    }, [
        'name',
        'release_dates.date',
        'rating',
        'hypes',
        'cover'
    ]).then(log);

    /*
    Search for two specific games by their IDs
    */
    client.games({
        ids: [
            18472,
            18228
        ]
    }, [
        'name',
        'cover'
    ]).then(log);

    /*
    Search for companies with 'rockstar' in their name. Return up to five
    results sorted by name in descending order
    */
    client.companies({
        field: 'name',
        limit: 5,
        offset: 0,
        order: 'name:desc',
        search: 'square enix'
    }, [
        'name',
        'logo'
    ]).then(log);
});


/**************************
 * Functions
**************************/
function updateDatabase(){
	request(function (error, response, body) {
		if (!error){
			gameData = JSON.parse(body).applist;
			gameData.checkDate = new Date();
			
			saveDatabase();
		}
	});
};


function loadDatabase(){
	fs.readFile(__dirname + gameDataJson, function(err, data){
		gameData = JSON.parse(data);
	});
};

function saveDatabase(){
	fs.writeFile(__dirname + gameDataJson, JSON.stringify(gameData), function(err){
		console.log("success saving file");
	});	
}


/**************************
 * export
**************************/

module.exports = {

	router: router,

	loadData : function () {
		loadDatabase();
	}

}