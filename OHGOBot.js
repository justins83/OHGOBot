
const request = require('request');
const fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var http = require('http');
var parseString = require('xml2js').parseString;
var AWS = require('aws-sdk');
const readline = require('readline');
var inside = require('point-in-polygon');
var NW = [ [ 41.69621150, -84.80620470 ], [ 41.74707970, -82.71565040 ], [40.57368660, -82.68183770 ], [ 40.54522630, -84.80279780 ] ];
var NE = [[41.62058260,-82.71194720],[41.98212010,-80.51942980],[40.56682920,-80.51892620],[40.57368660,-82.68183770]];
var SW = [[40.54522630,-84.80279780],[40.56826300,-83.41627120],[38.42400810,-83.37387080],[39.09809450,-84.88311770]];
var SE = [[39.70218290,-83.39936390],[39.71772530,-80.75030830],[38.36184910,-82.40226750],[38.60882250,-83.37799080]];
var C = [[40.56826300,-83.41626050],[40.56768290,-80.58881650],[39.71669450,-80.59157260],[39.70218290,-83.39935320]];
 
//https://discordapp.com/api/webhooks/392727461953011713/9iD33ib0JjD0RU-PWCoL9KN_VNJ3jrIiDfvAybQTvOcyU8qhU_rPrzgR2TgvczHOXp3z
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
		let LAM = "";
		let obj = ClosureObjToPost[index];
		if(inside([ obj.Latitude[0], obj.Longitude[0] ], NW))
			LAM = "NW";
		else if(inside([ obj.Latitude[0], obj.Longitude[0] ], NE))
			LAM = "NE";
		else if(inside([ obj.Latitude[0], obj.Longitude[0] ], SW))
			LAM = "SW";
		else if(inside([ obj.Latitude[0], obj.Longitude[0] ], SE))
			LAM = "SE";
		else if(inside([ obj.Latitude[0], obj.Longitude[0] ], C))
			LAM = "Central";
		else
			LAM = "Undetermined";

		request({
			method:'POST',
			url: webhook,
			json: {
						avatar_url:"http://ohgo.com/images/ohgo-logo.png",
					content: ":no_entry:" + obj.Category[0] + "\nLink: [WME](https://www.waze.com/editor/?env=usa&lon=" + obj.Longitude[0] + "&lat=" + obj.Latitude[0] + "&zoom=5)" +
					"\n**LAM**: " + LAM,
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
	var file = fs.createWriteStream('parsed.txt');
	file.on('error', function(err) { console.log(err);});
	postedIDs.forEach(function(v) {if(v != ""){ file.write(v + '\n'); }});
	file.end();
	
	/*let params = {Bucket: myBucket, Key: myKey, Body: postedIDs.join('\n')};
     s3.putObject(params, function(err, data) {
         if (err) {
             console.log(err)
         } else {
             console.log("Successfully uploaded data to myBucket/myKey");
         }

      });*/
}

function ReadFromFile()
{
	if(fs.existsSync('posted.txt'))
	{
		var array = fs.readFileSync('parsed.txt').toString().split("\n");
		for(i in array) {
			postedIDs.push(array[i]);
		}
	}
	/*
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
	});*/
}
var NWx=[41.69621150,41.74707970,40.57368660,40.54522630];
var NWy=[-84.80620470,-82.71565040,-82.68183770,-84.80279780];
var NEx=[41.62058260,41.98212010,40.56682920,40.57368660];
var NEy=[-82.71194720,-80.51942980,-80.51892620,-82.68183770];
var SWx=[40.54522630,40.56826300,38.42400810,39.09809450];
var SWy=[-84.80279780,-83.41627120,-83.37387080,-84.88311770];
var SEx=[39.70218290,39.71772530,38.36184910,38.60882250];
var SEy=[-83.39936390,-80.75030830,-82.40226750,-83.37799080];
var Cx=[40.56826300,40.56768290,39.71669450,39.70218290];
var Cy=[-83.41626050,-80.58881650,-80.59157260,-83.39935320];

function checkcheck (x, y, cornersX, cornersY) {

	var i, j=cornersX.length-1 ;
	var  oddNodes=false;

	var polyX = cornersX;
	var polyY = cornersY;

	for (i=0; i<cornersX.length; i++) {
		if ((polyY[i]< y && polyY[j]>=y ||  polyY[j]< y && polyY[i]>=y) &&  (polyX[i]<=x || polyX[j]<=x)) {
		  oddNodes^=(polyX[i]+(y-polyY[i])/(polyY[j]-polyY[i])*(polyX[j]-polyX[i])<x); 
		}
		j=i; 
	}

	  return oddNodes;
}
	

ReadFromFile();
xmlToJson(url, scrapeOHGO);
setInterval(function(){
	console.log("Interval!");
	xmlToJson(url, scrapeOHGO);}, 600000);
	
	
