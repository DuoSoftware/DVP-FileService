/**
 * Created by pawan on 3/26/2015.
 */

var redis=require('redis');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var DbConn = require('./DVP-DBModels');



var client = redis.createClient(6379,"192.168.0.68");
client.on("error", function (err) {
    console.log("Error " + err);
});


function RedisPublish(SID,AID,callback)
{
    try{
        client.publish("CSCOMMAND:"+SID+":downloadfile",AID,function(err,reply)
        {
            if(err)
            {
                callback(err,undefined);
            }
            else
            {
                callback(undefined,reply);
            }
        });
    }
    catch(ex)
    {
        callback(ex,undefined);
    }

}

function SharedServerRedisUpdate(SID,AID)
{
    SID.forEach(function(entry)
    {
        client.publish("CSCOMMAND:"+entry+":downloadfile",AID,function(err,reply)
        {
            if(err)
            {
                console.log("error in saving "+entry)
            }
            else if(reply)
            {
                console.log("Successfully saved "+entry)
            }
        });
    });

}

function RedisGet()
{
    client.get("CSCOMMAND:1:downloadfile",function(res)
    {
       console.log(res);
    });
}


/*
 function TestIt()
 {
 try{

 client.hexists('aps','T',function(err,res)
 {
 if(err)
 {
 console.log("error "+err);
 }
 else
 {
 console.log("Res "+res);
 }
 })
 }
 catch (ex)
 {

 }
 }
 */
module.exports.RedisPublish = RedisPublish;
module.exports.RedisGet = RedisGet;
module.exports.SharedServerRedisUpdate = SharedServerRedisUpdate;
