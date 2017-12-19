const request = require('request');
const fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var http = require('http');
var parseString = require('xml2js').parseString;
var AWS = require('aws-sdk');
const readline = require('readline');

const webhook = "https://discordapp.com/api/webhooks/392727461953011713/9iD33ib0JjD0RU-PWCoL9KN_VNJ3jrIiDfvAybQTvOcyU8qhU_rPrzgR2TgvczHOXp3z"; //test server webhook - "https://discordapp.com/api/webhooks/391299150211317761/tntWFj2dMjJi7JGJrn_bjMm_rg6REL8DugFpxQ5MqrByMkMjLy3M-_EJ3CVVK9_lM_Rt";
const url = "http://www.buckeyetraffic.org/services/roadactivity.aspx";
var postedIDs = [];
var x = 0;
var ClosureObjToPost = [];


var s3 = new AWS.S3();
var myBucket = 'ohgobot';
var myKey = 'parsed.txt';

function scrapeOHGO(err, data)
{
	if (err)
		return console.err(err);

	data.RoadActivities.RoadActivity.forEach(function(obj){
		if(obj.Status == "Closed" && postedIDs.indexOf(obj.Id[0]) < 0)
		{
			postedIDs.push(obj.Id[0]);
			ClosureObjToPost.push(obj);
		}
	});

	if(ClosureObjToPost.length >0)
		PostResults(0);
}

function PostResults(index)
{
	if(ClosureObjToPost.length > index)
	{
		let obj = ClosureObjToPost[index];
		request({
			method:'POST',
			url: webhook,
			json: {
						avatar_url:"http://ohgo.com/images/ohgo-logo.png",
					content: ":no_entry:" + obj.Category[0] + "\nLink: [WME](https://www.waze.com/editor/?env=usa&lon=" + obj.Longitude[0] + "&lat=" + obj.Latitude[0] + "&zoom=5)",
						embeds:[{
							"description": "**Status**: " + obj.Status[0] + " " + obj.Direction[0] + "\n**Road**: " + obj.Road[0] + "\n**County**: " + obj.CountyCode[0] +
							"\n**Start Date/Time**: " + obj.ActivityStartDateTime[0] + "\n**End Date/Time**: " + obj.ActivityEndDateTime[0] + "\n**Description**: " + obj.Description[0]
						}]
					}
		});
		setTimeout(function(){PostResults(index+1);},2500);
	}
	else
	{
		WriteToFile();
		ClosureObjToPost = [];
	}
}


function xmlToJson(url, callback) {
  var req = http.get(url, function(res) {
    var xml = '';

    res.on('data', function(chunk) {
      xml += chunk;
    });

    res.on('error', function(e) {
      callback(e, null);
    }); 

    res.on('timeout', function(e) {
      callback(e, null);
    }); 

    res.on('end', function() {
      parser.parseString(xml, function(err, result) {
        callback(null, result);
      });
    });
  });
}


function WriteToFile()
{
	//fs.unlinkSync('posted.txt');
	/*var file = fs.createWriteStream('parsed.txt');
	file.on('error', function(err) { console.log(err);});
	postedIDs.forEach(function(v) {if(v != ""){ file.write(v + '\n'); }});
	file.end();*/
	
	let params = {Bucket: myBucket, Key: myKey, Body: postedIDs.join('\n')};
     s3.putObject(params, function(err, data) {
         if (err) {
             console.log(err)
         } else {
             console.log("Successfully uploaded data to myBucket/myKey");
         }

      });
}

function ReadFromFile()
{
	/*if(fs.existsSync('posted.txt'))
	{
		var array = fs.readFileSync('parsed.txt').toString().split("\n");
		for(i in array) {
			postedIDs.push(array[i]);
		}
	}*/
	
	console.log("Reading S3");
	let params = {Bucket: myBucket, Key: myKey};
	const rl = readline.createInterface({
		input: s3.getObject(params).createReadStream()
	});

	rl.on('line', function(line) {
		postedIDs.push(line);
		console.log(line);
	})
	.on('close', function() {
	});
}

ReadFromFile();
xmlToJson(url, scrapeOHGO);
setInterval(function(){
	console.log("Interval!");
	xmlToJson(url, scrapeOHGO);}, 600000);
