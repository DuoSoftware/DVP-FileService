/**
 * Created by pawan on 3/26/2015.
 */

var redis=require('redis');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var DbConn = require('DVP-DBModels');
var log4js=require('log4js');

var config = require('config');
var hpath=config.Host.hostpath;

log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("redis");
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;



var port = config.Redis.port || 3000;
var ip = config.Redis.ip;


var client = redis.createClient(port,ip);
client.on("error", function (err) {
    console.log("Error " + err);
});


//log done...............................................................................................................

function RedisPublish(SID,AID,reqId,callback)
{
log.info("Publish to redis (instance/profile) : Inputs :-  ServerID : "+SID+" AttachmentDetails : "+AID);
if(client.connected)
{
    //log.info("Redis client is available");
    //console.log('Redis server is available');
    logger.info('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Redis client is Online',reqId);


            try{
                client.publish("CSCOMMAND:"+SID+":downloadfile",AID,function(err,reply)
                {
                    if(err)
                    {
                        //log.error("Redis publishing error  : "+err+" ServerID :  "+SID+" Attachment Details : "+AID);
                        logger.error('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Error occurred while publishing to redis - CSCOMMAND:%s:downloadfile  - > %s',reqId,SID,AID,err);
                        callback(err,undefined);
                    }
                    else
                    {
                        //log.info("Redis publishing is succeeded Result : "+reply+" ServerID :  "+SID+" Attachment Details : "+AID+" Result : ");
                        logger.info('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Redis publishing to Succeeded - CSCOMMAND:%s:downloadfile  - > %s',reqId,SID,AID);
                        callback(undefined,reply);
                    }
                });
            }
            catch(ex)
            {
                //log.fatal("Exception occurred in publishing on redis "+ex);
                logger.error('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Exception occurred while publishing to redis ',reqId,ex);
                callback(ex,undefined);
            }


}
    else
{
    //log.error("Redis server is not available");
    logger.error('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Redis client is not available ',reqId);
    callback('Redis Client is not available',undefined);
}


}

//log done...............................................................................................................
function SharedServerRedisUpdate(SID,AID,reqId)
{
    //log.info("Publish to redis (shared) : Inputs :-  ServerID : "+JSON.stringify(SID)+" AttachmentDetails : "+AID);
    logger.debug('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] - [REDIS] -[FS] - Shared type server selection method starts  - SERVERS - %s - Application - %s ',reqId,JSON.stringify(SID),AID);
    if(client.connected) {
        //log.info("Redis client is available");
        //console.log('Redis client is available');
        logger.info('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] - [REDIS] -[FS] - Redis Server is online  ');

try {
    SID.forEach(function (entry) {
        client.publish("CSCOMMAND:" + entry.id + ":downloadfile", AID, function (err, reply) {
            if (err) {
                //log.error("Redis publishing error : "+err+" Details ServerID : "+entry.id+ " Attachment Data : "+AID);
                logger.error('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] - [REDIS] -[FS] - Redis publishing error - CSCOMMAND:%s:downloadfile -> %s',reqId,entry.id,AID,err);
                //console.log("error in saving " + entry
            }
            else if (reply) {
                //log.info("Redis publishing is succeeded Result : "+reply+" ServerID "+entry.id+" Attachment Data : "+AID);
                logger.debug('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] -[REDIS] - [FS] - Redis publishing  succeeded - CSCOMMAND:%s:downloadfile -> %s',reqId,entry.id,AID);
                //console.log("Successfully saved " + entry)
            }
        });
    });

}
        catch(ex)
        {
            //log.fatal("Exception occurred "+ex);
            //console.log('Exception  occurred in publishing on redis "+ex');
            logger.error('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] -[REDIS] - [FS] - Exception  occurred in sever list publishing ',reqId,ex);
        }
    }
    else
    {
        //log.error("Redis client is not available");
        //console.log('Redis server is not available');
        logger.error('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] -[REDIS] - [FS] - Redis server is Offline ');
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
