/**
 * Created by pawan on 3/26/2015.
 */

var redis=require('ioredis');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');


var config = require('config');
var hpath=config.Host.hostpath;
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;



var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redispass = config.Redis.password;
var redismode = config.Redis.mode;
var redisdb = config.Redis.db;



var redisSetting =  {
    port:redisport,
    host:redisip,
    family: 4,
    password: redispass,
    db: redisdb,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {

        return true;
    }
};

if(redismode == 'sentinel'){

    if(config.Redis.sentinels && config.Redis.sentinels.hosts && config.Redis.sentinels.port, config.Redis.sentinels.name){
        var sentinelHosts = config.Redis.sentinels.hosts.split(',');
        if(Array.isArray(sentinelHosts) && sentinelHosts.length > 2){
            var sentinelConnections = [];

            sentinelHosts.forEach(function(item){

                sentinelConnections.push({host: item, port:config.Redis.sentinels.port})

            })

            redisSetting = {
                sentinels:sentinelConnections,
                name: config.Redis.sentinels.name,
                password: redispass
            }

        }else{

            console.log("No enough sentinel servers found .........");
        }

    }
}

var client = undefined;

if(redismode != "cluster") {
    client = new redis(redisSetting);
}else{

    var redisHosts = redisip.split(",");
    if(Array.isArray(redisHosts)){


        redisSetting = [];
        redisHosts.forEach(function(item){
            redisSetting.push({
                host: item,
                port: redisport,
                family: 4,
                password: redispass});
        });

        var client = new redis.Cluster([redisSetting]);

    }else{

        client = new redis(redisSetting);
    }


}


client.on("error", function (err) {
    console.log("Error " + err);


});




function RedisPublish(SID,AID,reqId,callback)
{

 logger.info('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Redis client is Online',reqId);


            try{
                client.publish("CSCOMMAND:"+SID+":downloadfile",AID,function(err,reply)
                {
                    if(err)
                    {
                        logger.error('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Error occurred while publishing to redis - CSCOMMAND:%s:downloadfile  - > %s',reqId,SID,AID,err);
                        callback(err,undefined);
                    }
                    else
                    {
                        logger.info('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Redis publishing to Succeeded - CSCOMMAND:%s:downloadfile  - > %s',reqId,SID,AID);
                        callback(undefined,reply);
                    }
                });
            }
            catch(ex)
            {
                logger.error('[DVP-FIleService.UploadFile.RedisPublisher] - [%s] - [REDIS] - Exception occurred while publishing to redis ',reqId,ex);
                callback(ex,undefined);
            }


}

//log done...............................................................................................................
function SharedServerRedisUpdate(SID,AID,reqId)
{
    logger.debug('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] - [REDIS] -[FS] - Shared type server selection method starts  - SERVERS - %s - Application - %s ',reqId,JSON.stringify(SID),AID);
   try {
    SID.forEach(function (entry) {
        client.publish("CSCOMMAND:" + entry.id + ":downloadfile", AID, function (err, reply) {
            if (err) {
                logger.error('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] - [REDIS] -[FS] - Redis publishing error - CSCOMMAND:%s:downloadfile -> %s',reqId,entry.id,AID,err);

            }
            else if (reply) {
                logger.debug('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] -[REDIS] - [FS] - Redis publishing  succeeded - CSCOMMAND:%s:downloadfile -> %s',reqId,entry.id,AID);
            }
        });
    });

}
        catch(ex)
        {
            logger.error('[DVP-FIleService.RedisPublisher.SharedServerRedisUpdate] - [%s] -[REDIS] - [FS] - Exception  occurred in sever list publishing ',reqId,ex);
        }
}

function RedisGet()
{
    client.get("CSCOMMAND:1:downloadfile",function(res)
    {
       console.log(res);
    });
}

function incrementTotalFileStorage(fileSize,company,tenant)
{
    var fileKey = tenant+":"+company+":STORAGE:TOTAL";
        client.get(fileKey, function (errKey,resKey) {
            if(errKey)
            {
                //callback(errKey,resKey);
                logger.error('[DVP-FIleService.RedisPublisher.updateTotalFileStorage] - [%s] -[REDIS] - [FS] - Error in getting Key ');
            }
            else
            {
                if(!resKey)
                {
                    client.set(fileKey,fileSize, function (errSet,resSet) {

                        if(errSet)
                        {
                            logger.error('[DVP-FIleService.RedisPublisher.updateTotalFileStorage] - [%s] -[REDIS] - [FS] - Error in setting new Key '+errSet);
                        }
                        else
                        {
                            logger.debug('[DVP-FIleService.RedisPublisher.updateTotalFileStorage] - [%s] -[REDIS] - [FS] - setting new Key succeeded ');
                        }

                    });
                }
                else
                {
                    client.incrby(fileKey,fileSize, function (errSet,resSet) {

                        if(errSet)
                        {
                            logger.error('[DVP-FIleService.RedisPublisher.updateTotalFileStorage] - [%s] -[REDIS] - [FS] - Key incrementing failed '+errSet);
                        }
                        else
                        {
                            logger.debug('[DVP-FIleService.RedisPublisher.updateTotalFileStorage] - [%s] -[REDIS] - [FS] -  Key incrementing succeeded ');
                        }
                    });
                }
            }
        })
}
function decrementTotalFileStorage(fileSize,company,tenant)
{
    console.log("Trying to update total storage details");
    var fileKey = tenant+":"+company+":STORAGE:TOTAL";

            client.decrby(fileKey,fileSize, function (errKey,resKey) {
                if(errKey)
                {
                    //callback(errKey,resKey);
                    logger.error('[DVP-FIleService.RedisPublisher.decrementTotalFileStorage] - [%s] -[REDIS] - [FS] - Error in releasing storage ');

                }
                else
                {
                    if(!resKey)
                    {
                        logger.debug('[DVP-FIleService.RedisPublisher.decrementTotalFileStorage] - [%s] -[REDIS] - [FS] -  No record for key ');

                    }
                    else
                    {
                        logger.debug('[DVP-FIleService.RedisPublisher.decrementTotalFileStorage] - [%s] -[REDIS] - [FS] - Storage releasing succeeded ');


                    }
                }
            })

}


function updateFileStorageRecord(fileCategory,fileSize,company,tenant)
{
    var fileKey = tenant+":"+company+":STORAGE:"+fileCategory;
        client.get(fileKey, function (errKey,resKey) {
            if(errKey)
            {
                //callback(errKey,resKey);
                logger.error('[DVP-FIleService.RedisPublisher.updateFileStorageRecord] - [%s] -[REDIS] - [FS] - Error in getting Key ');
            }
            else
            {
                if(!resKey)
                {
                    client.set(fileKey,fileSize, function (errSet,resSet) {

                        if(errSet)
                        {
                            logger.error('[DVP-FIleService.RedisPublisher.updateFileStorageRecord] - [%s] -[REDIS] - [FS] - Error in setting new Key '+errSet);
                        }
                        else
                        {
                            logger.debug('[DVP-FIleService.RedisPublisher.updateFileStorageRecord] - [%s] -[REDIS] - [FS] - setting new Key succeeded ');
                            incrementTotalFileStorage(fileSize,company,tenant);
                        }

                    });
                }
                else
                {
                    client.incrby(fileKey,fileSize, function (errSet,resSet) {

                        if(errSet)
                        {
                            logger.error('[DVP-FIleService.RedisPublisher.updateFileStorageRecord] - [%s] -[REDIS] - [FS] - Key incrementing failed '+errSet);
                        }
                        else
                        {
                            logger.debug('[DVP-FIleService.RedisPublisher.updateFileStorageRecord] - [%s] -[REDIS] - [FS] -  Key incrementing succeeded ');
                            incrementTotalFileStorage(fileSize,company,tenant);
                        }
                    });
                }
            }
        })
}



function getFileStorageRecordByCategory(fileCategory,company,tenant,callback)
{
     var fileKey = tenant+":"+company+":STORAGE:"+fileCategory;
        client.get(fileKey, function (errKey,resKey) {
            if(errKey)
            {
                //callback(errKey,resKey);
                logger.error('[DVP-FIleService.RedisPublisher.getFileStorageRecordByCategory] - [%s] -[REDIS] - [FS] - Error in getting Key ');
                callback(errKey,undefined);
            }
            else
            {
                if(!resKey)
                {
                    logger.debug('[DVP-FIleService.RedisPublisher.getFileStorageRecordByCategory] - [%s] -[REDIS] - [FS] -  No record for key ');
                    callback(undefined,0);
                }
                else
                {
                    logger.debug('[DVP-FIleService.RedisPublisher.getFileStorageRecordByCategory] - [%s] -[REDIS] - [FS] -  Record found ');
                    callback(undefined,resKey);
                }
            }
        })
}
function getTotalFileStorageDetails(company,tenant,callback)
{
    var fileKey = tenant+":"+company+":STORAGE:TOTAL";
        client.get(fileKey, function (errKey,resKey) {
            if(errKey)
            {
                //callback(errKey,resKey);
                logger.error('[DVP-FIleService.RedisPublisher.getTotalFileStorageDetails] - [%s] -[REDIS] - [FS] - Error in getting Key ');
                callback(errKey,undefined);
            }
            else
            {
                if(!resKey)
                {
                    logger.debug('[DVP-FIleService.RedisPublisher.getTotalFileStorageDetails] - [%s] -[REDIS] - [FS] -  No record for key ');
                    callback(undefined,0);
                }
                else
                {

                    logger.debug('[DVP-FIleService.RedisPublisher.getTotalFileStorageDetails] - [%s] -[REDIS] - [FS] -  Record founf for Total ');
                    callback(undefined,resKey);
                }
            }
        })
}
function UpdateFileStorageRecords(action,fileCategory,fileSize,company,tenant)
{
    var fileKey = tenant+":"+company+":STORAGE:"+fileCategory;
        if(action=="RELEASE")
        {
            client.decrby(fileKey,fileSize, function (errKey,resKey) {
                if(errKey)
                {
                    //callback(errKey,resKey);
                    logger.error('[DVP-FIleService.RedisPublisher.UpdateFileStorageRecords] - [%s] -[REDIS] - [FS] - Error in releasing storage ');

                }
                else
                {
                    if(!resKey)
                    {
                        logger.debug('[DVP-FIleService.RedisPublisher.UpdateFileStorageRecords] - [%s] -[REDIS] - [FS] -  No record for key ');

                    }
                    else
                    {
                        logger.debug('[DVP-FIleService.RedisPublisher.UpdateFileStorageRecords] - [%s] -[REDIS] - [FS] - Storage releasing succeeded ');
                        decrementTotalFileStorage(fileSize,company,tenant);

                    }
                }
            })
        }
        else
        {
            logger.error('[DVP-FIleService.RedisPublisher.UpdateFileStorageRecords] - [%s] -[REDIS] - [FS] - Invalid action found ');

        }
}

/*function removeAllFileStorageRecords(company,tenant,callback)
{
    if(client.connected) {
        var fileKey = tenant+":"+company+":STORAGE:*";
        client.keys(fileKey, function (errKey,resKey) {
            if(errKey)
            {
                //callback(errKey,resKey);
                logger.error('[DVP-FIleService.RedisPublisher.removeAllFileStorageRecords] - [%s] -[REDIS] - [FS] - Error in getting Key ');
                callback(errKey,undefined);
            }
            else
            {
                if(!resKey)
                {
                    logger.debug('[DVP-FIleService.RedisPublisher.removeAllFileStorageRecords] - [%s] -[REDIS] - [FS] -  No record for key ');
                    callback(undefined,0);
                }
                else
                {
                    var storage=0;


                    client.mset(qObj, function (errFkeys,resFkeys) {
                        if(errFkeys)
                        {

                            logger.error('[DVP-FIleService.RedisPublisher.removeAllFileStorageRecords] - [%s] -[REDIS] - [FS] - Error in getting Key ');
                            callback(errFkeys,undefined);


                        }
                        else
                        {

                            logger.debug('[DVP-FIleService.RedisPublisher.removeAllFileStorageRecords] - [%s] -[REDIS] - [FS] -  Record found ');
                            callback(undefined,resFkeys);
                        }


                    });

                }
            }
        })
    }
    else
    {
        logger.error('[DVP-FIleService.RedisPublisher.removeAllFileStorageRecords] - [%s] -[REDIS] - [FS] - Redis connection failed');
        callback(new Error("Redis client connection failed"),undefined);
    }
}*/


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
module.exports.updateFileStorageRecord = updateFileStorageRecord;
module.exports.getFileStorageRecordByCategory = getFileStorageRecordByCategory;
module.exports.getTotalFileStorageDetails = getTotalFileStorageDetails;
module.exports.UpdateFileStorageRecords = UpdateFileStorageRecords;
/*module.exports.removeAllFileStorageRecords = removeAllFileStorageRecords;*/
