/*npm install xml2js*/

/*const discord = require('discord.js');
const bot = new discord.Client();
const token = "hI8w0DoL2pXShaO-eFAcu6jQy1cQ-i18";*/
const request = require('request');
const fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var http = require('http');
var parseString = require('xml2js').parseString;

const webhook = "https://discordapp.com/api/webhooks/390538252534284298/fKU6jZWPQ7nWMDci49NPIWjVNdaBqjQdy0JS8dly8x13s4YjqCwnvqFFsDPu47PBoBSX";
const url = "http://www.buckeyetraffic.org/services/roadactivity.aspx";
var postedIDs = [];
var x = 0;
var ClosureObjToPost = [];



function scrapeOHGO(err, data)
{
	if (err)
		return console.err(err);

	data.RoadActivities.RoadActivity.forEach(function(obj){
		if(obj.Status == "Closed" && postedIDs.indexOf(obj.Id[0]) < 0)
		{
			ClosureObjToPost.push(obj);
		}
	});
console.log(ClosureObjToPost.length);
	PostResults(0);
	WriteToFile();
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
		postedIDs.push(obj.Id[0]);
		setTimeout(function(){PostResults(index+1);},2500);
	}
	else
		WriteToFile();
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
	var file = fs.createWriteStream('posted.txt');
	file.on('error', function(err) { console.log(err);});
	postedIDs.forEach(function(v) {if(v != ""){ file.write(v + '\n'); }});
	file.end();

}

function ReadFromFile()
{
	var array = fs.readFileSync('posted.txt').toString().split("\n");
	for(i in array) {
		postedIDs.push(array[i]);
	}
}

ReadFromFile();
xmlToJson(url, scrapeOHGO);
setInterval(function(){xmlToJson(url, scrapeOHGO);}, 600000);