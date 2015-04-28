/**
 * Created by pawan on 3/26/2015.
 */

var redis=require('redis');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var DbConn = require('DVP-DBModels');
var log4js=require('log4js');

var config = require('config');

log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("redis");



var port = config.Redis.port || 3000;
var ip = config.Redis.ip;


var client = redis.createClient(port,ip);
client.on("error", function (err) {
    console.log("Error " + err);
});


//log done...............................................................................................................

function RedisPublish(SID,AID,callback)
{
log.info("Publish to redis (instance/profile) : Inputs :-  ServerID : "+SID.id+" AttachmentDetails : "+AID);
if(client.connected)
{
    log.info("Redis client is available");
    console.log('Redis server is available');


            try{
                client.publish("CSCOMMAND:"+SID+":downloadfile",AID,function(err,reply)
                {
                    if(err)
                    {
                        log.error("Redis publishing error  : "+err+" ServerID :  "+SID+" Attachment Details : "+AID);
                        callback(err,undefined);
                    }
                    else
                    {
                        log.info("Redis publishing is succeeded Result : "+reply+" ServerID :  "+SID+" Attachment Details : "+AID+" Result : ");
                        callback(undefined,reply);
                    }
                });
            }
            catch(ex)
            {
                log.fatal("Exception occurred in publishing on redis "+ex);
                callback(ex,undefined);
            }


}
    else
{
    log.error("Redis server is not available");
    callback('Redis Client is not avalable',undefined);
}


}

//log done...............................................................................................................
function SharedServerRedisUpdate(SID,AID)
{
    log.info("Publish to redis (shared) : Inputs :-  ServerID : "+JSON.stringify(SID)+" AttachmentDetails : "+AID);
    if(client.connected) {
        log.info("Redis client is available");
        console.log('Redis client is available');

try {
    SID.forEach(function (entry) {
        client.publish("CSCOMMAND:" + entry.id + ":downloadfile", AID, function (err, reply) {
            if (err) {
                log.error("Redis publishing error : "+err+" Details ServerID : "+entry.id+ " Attachment Data : "+AID);
                console.log("error in saving " + entry)
            }
            else if (reply) {
                log.info("Redis publishing is succeeded Result : "+reply+" ServerID "+entry.id+" Attachment Data : "+AID);
                console.log("Successfully saved " + entry)
            }
        });
    });

}
        catch(ex)
        {
            log.fatal("Exception occurred "+ex);
            console.log('Exception  occurred in publishing on redis "+ex');
        }
    }
    else
    {
        log.error("Redis client is not available");
        console.log('Redis server is not available');
    }

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
