//var attachmate = require('attachmate');
var fstream = require('fstream');
var path = require('path');
var uuid = require('node-uuid');
var DbConn = require('dvp-dbmodels');
var config = require('config');
var sequelize = require('sequelize');

//Sprint 5
//var couchbase = require('couchbase');
var streamifier = require('streamifier');
var Cbucket=config.Couch.bucket;
var CHip=config.Couch.ip;
//var cluster = new couchbase.Cluster("couchbase://"+CHip);
var RedisPublisher=require('./RedisPublisher.js');
const crypto = require('crypto');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');


//


//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
//var couchbase = require('couchbase');
var sys=require('sys');
var done       =       false;
var fs=require('fs');
var log4js=require('log4js');


var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var config = require('config');
var mongodb = require('mongodb');

var moment= require('moment');
var easyimg = require('easyimage');
var util = require('util');



var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    assert = require('assert');




var mongoip = config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodbase=config.Mongo.dbname;
var mongopass=config.Mongo.password;
var mongouser=config.Mongo.user;
var mongoreplicaset=config.Mongo.replicaset;


var config = require('config');

var hpath=config.Host.hostpath;


log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("fhandler");

var crptoAlgo = config.Crypto.algo;
var crptoPwd = config.Crypto.password;



var uri = '';
mongoip = mongoip.split(',');
if(util.isArray(mongoip)){

    mongoip.forEach(function(item){
        uri += util.format('%s:%d,',item,mongoport)
    });

    uri = uri.substring(0, uri.length - 1);
    uri = util.format('mongodb://%s:%s@%s/%s',mongouser,mongopass,uri,mongodbase);

    if(mongoreplicaset){
        uri = util.format('%s?replicaSet=%s',uri,mongoreplicaset) ;
        console.log("URI ...   "+uri);
    }
}else{

    uri = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodbase);
    console.log("URI ...   "+uri);
}


log.info('\n.............................................File handler Starts....................................................\n');


//log done...............................................................................................................
function PickAttachmentMetaData(UUID,Company,Tenant,reqId,callback)
{
    if(UUID)
    {
        try {
            DbConn.FileUpload.find({where: [{UniqueId: UUID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resFile) {

                if(resFile)
                {
                    logger.debug('[DVP-FIleService.PickAttachmentMetaData] - [%s] - [PGSQL] - Uploaded file %s  metadata found ',reqId,UUID);
                    callback(undefined, resFile);
                }
                else
                {
                    logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - [PGSQL] - Uploaded file %s metadata not found ',reqId,UUID);
                    callback(new Error('No record found for id : '+UUID), undefined);
                }

            }).catch(function (errFile) {
                logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - [PGSQL] - Error occurred while searching for Uploaded file Metadata %s  ',reqId,UUID);
                callback(errFile, undefined);
            });




        }
        catch (ex) {
            logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Exception occurred when starting PickAttachmentMetaData %s ',reqId,UUID);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Invalid Input for UUID %s',reqId,UUID);
        callback(new Error("Invalid Input for UUID"), undefined);
    }

}


function PickAttachmentMetaDataByName(FileName,Company,Tenant,reqId,callback)
{
    if(FileName)
    {
        try {
            logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Searching for Uploaded file %s',reqId,FileName);

            DbConn.FileUpload.max('Version',{where: [{Filename: FileName},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resMax) {
                if(resMax)
                {
                    logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Max version found for file %s',reqId,FileName);

                    DbConn.FileUpload.find({where:[{CompanyId:Company},{TenantId:Tenant},{Filename: FileName},{Version:resMax}]}).then(function (resUpFile) {

                        if(resUpFile)
                        {
                            logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Fie found',reqId,FileName);
                            callback(undefined,resUpFile);

                        }
                        else
                        {
                            logger.error('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - No such file found',reqId,FileName);
                            callback(undefined,resUpFile);
                        }

                    }).catch(function (errFile) {
                        logger.error('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Error in searching files',reqId,FileName);
                        callback(errFile,undefined);
                    });
                }
                else
                {
                    logger.error('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - No version found ',reqId,FileName);
                    callback(undefined,resMax);
                }
            }).catch(function (errMax) {
                logger.error('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Error in searching max version ',reqId,FileName);
                callback(errMax,undefined);
            });




        }
        catch (ex) {
            logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Exception occurred when starting PickAttachmentMetaData %s ',reqId,FileName);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Invalid Input for FileName %s',reqId,FileName);
        callback(new Error("Invalid Input for FileName"), undefined);
    }

}

//log done...............................................................................................................

function MongoFileDownloader(UUID,isEncryptedFile,method,res) {

    mongodb.MongoClient.connect(uri, function(error, db)
    {


        if(error)
        {
            console.log("Mongo Error ",error);
            res.status(400);
            db.close();
            res.end();
        }
        else
        {
            var bucket = new mongodb.GridFSBucket(db, {
                chunkSizeBytes: 1024
            });
            //res.setHeader('Content-Type', resUpFile.FileStructure);

            var source= bucket.openDownloadStreamByName(UUID);

            if(isEncryptedFile && method=="DEFAULT")
            {
                console.log("Encrypted file found, Decrypting");
                var decrypt = crypto.createDecipher(crptoAlgo, crptoPwd);
                source.pipe(decrypt).pipe(res).
                on('error', function(error) {
                    console.log('Error in piping!'+error);
                    decrypt.end();
                    res.status(400);
                    db.close();

                    var jsonString = messageFormatter.FormatMessage(error, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Error in Downloading file : %s ', reqId, jsonString);
                    res.end(jsonString);

                    res.end();
                    //callback(error,undefined);
                }).
                on('finish', function() {
                    console.log('done! Piping succeeded');
                    decrypt.end();
                    res.status(200);
                    db.close();
                    res.end();
                    //process.exit(0);
                });
            }
            else
            {
                console.log("File is not encrypted, Piping started");
                source.pipe(res).
                on('error', function(error) {
                    console.log('Error ! Piping Error'+error);
                    res.status(400);
                    db.close();
                    res.end();
                    //callback(error,undefined);
                }).
                on('finish', function() {
                    console.log('done! Piping succeeded');
                    res.status(200);
                    db.close();
                    res.end();
                    //process.exit(0);
                });
            }


        }
        //console.log("db "+JSON.stringify(db));
        //assert.ifError(error);


    });

};

function LocalFileDownloader(fileObj,res) {
    logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Record found for File upload %s',fileObj.reqId,fileObj.id);
    try {
        res.setHeader('Content-Type', fileObj.FileStructure);
        var SourcePath = path.join(fileObj.URL.toString());
        logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',fileObj.reqId,SourcePath);

        logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',fileObj.reqId);

        var source = fs.createReadStream(SourcePath);
        if(fileObj.isEncryptedFile && fileObj.method=="DEFAULT")
        {
            console.log("Encripted file found");
            var decrypt = crypto.createDecipher(crptoAlgo, crptoPwd);
            source.pipe(decrypt).pipe(res).on('end', function (result) {
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',fileObj.reqId);
                res.status(200);
                res.end();
            }).on('error', function (err) {
                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',fileObj.reqId,err);
                res.status(400);
                res.end();
            });


        }
        else
        {
            source.pipe(res).on('end', function (result) {
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',fileObj.reqId);
                res.status(200);
                res.end();
            }).on('error', function (err) {
                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',fileObj.reqId,err);
                res.status(400);
                res.end();
            });
        }

    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',fileObj.reqId,ex);

        callback(ex, undefined);
        res.status(400);
        res.end();
    }
}


function DownloadFileByID(res,fileObj)
{
    var isEncryptedFile = false;
    var readyToDownload=false;

    if(fileObj.id)
    {
        try {

            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Searching for Uploaded file %s',fileObj.reqId,fileObj.id);
            DbConn.FileUpload.find({where: [{UniqueId: fileObj.id},{CompanyId:fileObj.Company},{TenantId:fileObj.Tenant}],include:[{model:DbConn.FileCategory , as:"FileCategory"}]}).then(function (resUpFile) {

                if (resUpFile) {

                    var resObj=
                        {
                            "Last-Modified":resUpFile.createdAt,
                            "ETag":resUpFile.UniqueId+":"+"display"+":"+resUpFile.Version
                        };

                    var dataObj =
                        {
                            reqId:fileObj.reqId,
                            FileStructure:resUpFile.FileStructure,
                            URL:resUpFile.URL,
                            isEncryptedFile:isEncryptedFile,
                            method:fileObj.method

                        }


                    if(resUpFile.FileCategory)
                    {
                        isEncryptedFile=resUpFile.FileCategory.Encripted;

                    }

                    if(fileObj.userType=="Agent" )
                    {
                        if(resUpFile.FileCategory.Category=="AGENT_GREETINGS" )
                        {
                            readyToDownload=true;
                        }


                    }
                    else
                    {
                        readyToDownload=true;
                    }


                    if(readyToDownload)
                    {


                            if(resUpFile.Source=="MONGO")
                            {
                                MongoFileDownloader(fileObj.id,isEncryptedFile,fileObj.method,res);
                            }
                            else if(resUpFile.Source=="LOCAL")
                            {
                                LocalFileDownloader(dataObj,res);
                            }
                            else
                            {
                                if(fileObj.option.toUpperCase()=="MONGO")
                                {
                                    MongoFileDownloader(fileObj.id,isEncryptedFile,fileObj.method,res);
                                }
                                else
                                {
                                    LocalFileDownloader(dataObj,res);
                                }


                            }




                       /* if(fileObj.option.toUpperCase()=="MONGO")
                        {

                            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [MONGO] - Downloading from Mongo',reqId,JSON.stringify(resUpFile));

                            var extArr=resUpFile.FileStructure.split('/');
                            var extension=extArr[1];



                            mongodb.MongoClient.connect(uri, function(error, db)
                            {


                                if(error)
                                {
                                    console.log("Mongo Error ",error);
                                    res.status(400);
                                    db.close();
                                    res.end();
                                }
                                else
                                {
                                    var bucket = new mongodb.GridFSBucket(db, {
                                        chunkSizeBytes: 1024
                                    });
                                    //res.setHeader('Content-Type', resUpFile.FileStructure);

                                    var source= bucket.openDownloadStreamByName(UUID);

                                    if(isEncryptedFile)
                                    {
                                        console.log("Encrypted file found, Decrypting");
                                        var decrypt = crypto.createDecipher(crptoAlgo, crptoPwd);
                                        source.pipe(decrypt).pipe(res).
                                        on('error', function(error) {
                                            console.log('Error in piping!'+error);
                                            decrypt.end();
                                            res.status(400);
                                            db.close();
                                            res.end();
                                            //callback(error,undefined);
                                        }).
                                        on('finish', function() {
                                            console.log('done! Piping succeeded');
                                            decrypt.end();
                                            res.status(200);
                                            db.close();
                                            res.end();
                                            //process.exit(0);
                                        });
                                    }
                                    else
                                    {
                                        console.log("File is not encrypted, Piping started");
                                        source.pipe(res).
                                        on('error', function(error) {
                                            console.log('Error ! Piping Error'+error);
                                            res.status(400);
                                            db.close();
                                            res.end();
                                            //callback(error,undefined);
                                        }).
                                        on('finish', function() {
                                            console.log('done! Piping succeeded');
                                            res.status(200);
                                            db.close();
                                            res.end();
                                            //process.exit(0);
                                        });
                                    }


                                }
                                //console.log("db "+JSON.stringify(db));
                                //assert.ifError(error);


                            });



                        }
                        else if(option.toUpperCase()=="COUCH")
                        {
                            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [MONGO] - Downloading from Couch',reqId,JSON.stringify(resUpFile));

                            var bucket = cluster.openBucket(Cbucket);

                            bucket.get(UUID, function(err, result) {
                                if (err)
                                {
                                    console.log(err);

                                    callback(err,undefined);
                                    res.status(400);
                                    res.end();
                                }else
                                {
                                    console.log(resUpFile.FileStructure);
                                    res.setHeader('Content-Type', resUpFile.FileStructure);
                                    //var SourcePath = (resUpFile.URL.toString()).replace('\',' / '');
                                    //var source = fs.createReadStream(SourcePath);
                                    //var dest = fs.createWriteStream('C:/Users/pawan/Desktop/ddd.mp3');

                                    var s = streamifier.createReadStream(result.value);

                                    if(isEncryptedFile)
                                    {
                                        s.pipe(decrypt).pipe(res)
                                            .on('end', function (result) {
                                                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Streaming succeeded',reqId);
                                                SaveDownloadDetails(resUpFile,reqId,function(errSv,resSv)
                                                {
                                                    if(errSv)
                                                    {
                                                        callback(errSv,undefined);
                                                    }
                                                    else
                                                    {
                                                        callback(undefined,resSv);
                                                    }
                                                });


                                                console.log("ENDED");
                                                res.status(200);
                                                res.end();
                                            }).on('error', function (err) {
                                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                            console.log("ERROR");
                                            res.status(400);
                                            res.end();
                                        });
                                    }
                                    else
                                    {
                                        s.on('end', function (result) {
                                            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Streaming succeeded',reqId);
                                            SaveDownloadDetails(resUpFile,reqId,function(errSv,resSv)
                                            {
                                                if(errSv)
                                                {
                                                    callback(errSv,undefined);
                                                }
                                                else
                                                {
                                                    callback(undefined,resSv);
                                                }
                                            });


                                            console.log("ENDED");
                                            res.status(200);
                                            res.end();
                                        }).on('error', function (err) {
                                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                            console.log("ERROR");
                                            res.status(400);
                                            res.end();
                                        });
                                    }


                                }

                                //console.log("W is "+JSON.stringify(result.value));
                                // strm.pipe(dest);
                                // {name: Frank}



                            });


                        }
                        else
                        {
                            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Record found for File upload %s',reqId,JSON.stringify(resUpFile));
                            try {
                                res.setHeader('Content-Type', resUpFile.FileStructure);
                                var SourcePath = path.join(resUpFile.URL.toString());
                                logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',reqId,SourcePath);

                                logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',reqId);

                                var source = fs.createReadStream(SourcePath);
                                if(isEncryptedFile)
                                {
                                    console.log("Encripted file found");
                                    var decrypt = crypto.createDecipher(crptoAlgo, crptoPwd);
                                    source.pipe(decrypt).pipe(res).on('end', function (result) {
                                        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                        res.status(200);
                                        res.end();
                                    }).on('error', function (err) {
                                        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                        res.status(400);
                                        res.end();
                                    });


                                }
                                else
                                {
                                    source.pipe(res).on('end', function (result) {
                                        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                        res.status(200);
                                        res.end();
                                    }).on('error', function (err) {
                                        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                        res.status(400);
                                        res.end();
                                    });
                                }

                            }
                            catch(ex)
                            {
                                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);

                                callback(ex, undefined);
                                res.status(400);
                                res.end();
                            }
                        }*/
                    }
                    else
                    {
                        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Unauthorized to download',fileObj.reqId);

                        callback(new Error("Unauthorized to download"), undefined);
                        res.status(400);
                        res.end();
                    }



                }

                else {
                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - No record found for  Uploaded file  %s',fileObj.reqId,fileObj.id);
                    callback(new Error('No record for id : ' + fileObj.id), undefined);
                    res.status(404);
                    res.end();

                }

            }).catch(function (errUpFile) {

                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while searching Uploaded file  %s',fileObj.reqId,fileObj.id,errUpFile);
                callback(errUpFile, undefined);
                res.status(400);
                res.end();

            });



        }
        catch (ex) {
            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',fileObj.reqId,fileObj.id);
            callback(new Error("No record Found for the request"), undefined);
            res.status(400);
            res.end();
        }
    }
    else
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - No record found for UUID %s',fileObj.reqId);
        callback(new Error("Invalid input for UUID"), undefined);
        res.status(404);
        res.end();
    }

}

function FileInfoByID(res,UUID,Company,Tenant,reqId)
{
    logger.debug('[DVP-FIleService.FileInfoByID] - [%s] - Searching for Uploaded file %s',reqId,UUID);
    if(UUID)
    {
        DbConn.FileUpload.find({where: [{UniqueId: UUID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resFile) {

            if(resFile)
            {
                res.header('ETag', resFile.UniqueId);
                res.header('Last-Modified', resFile.updatedAt);
                res.status(200);
                res.end();
            }
            else
            {
                logger.debug('[DVP-FIleService.FileInfoByID] - [%s] - No such file found for ID %s',reqId,UUID);
                res.status(404);
                res.end();
            }
        }).catch(function (errFile) {
            logger.error('[DVP-FIleService.FileInfoByID] - [%s] - Error in searching records for ID  %s',reqId,UUID,errFile);
            res.status(400);
            res.end();
        });
    }
    else
    {
        logger.error('[DVP-FIleService.FileInfoByID] - [%s] - Invalid ID  %s',reqId,UUID);
        res.status(404);
        res.end();
    }

};

function DownloadLatestFileByID(res,fileObj)
{

    try {
        logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Searching for Uploaded file %s',fileObj.reqId,fileObj.FileName);

        DbConn.FileUpload.max('Version',{where: [{Filename: fileObj.FileName},{CompanyId:fileObj.Company},{TenantId:fileObj.Tenant}]}).then(function (resMax) {
            if(resMax)
            {
                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Max version found for file %s',fileObj.reqId,fileObj.FileName);

                DbConn.FileUpload.findOne({where:[{CompanyId:fileObj.Company},{TenantId:fileObj.Tenant},{Filename: fileObj.FileName},{Version:resMax}],include:[{model:DbConn.FileCategory , as:"FileCategory"}]}).then(function (resUpFile) {

                    if(resUpFile)
                    {

                        var UUID=resUpFile.UniqueId;
                        var isEncryptedFile = false;

                        if(resUpFile.FileCategory)
                        {
                            isEncryptedFile=resUpFile.FileCategory.Encripted;



                        }
                        logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - ID found of file %s  ID : %s ',fileObj.reqId,fileObj.FileName,UUID);


                        var dataObj =
                            {
                                reqId:fileObj.reqId,
                                FileStructure:resUpFile.FileStructure,
                                URL:resUpFile.URL,
                                isEncryptedFile:isEncryptedFile,
                                method:fileObj.method

                            }


                        if(resUpFile.Source=="MONGO")
                        {
                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Downloading from Mongo',fileObj.reqId,JSON.stringify(resUpFile));
                            MongoFileDownloader(UUID,isEncryptedFile,fileObj.method,res);
                        }
                        else if(resUpFile.Source=="LOCAL")
                        {
                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [PGSQL] - Record found for File upload %s',fileObj.reqId,JSON.stringify(resUpFile));
                            LocalFileDownloader(dataObj,res);
                        }
                        else
                        {
                            if(fileObj.option.toUpperCase()=="MONGO")
                            {
                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Downloading from Mongo',fileObj.reqId,JSON.stringify(resUpFile));
                                MongoFileDownloader(UUID,isEncryptedFile,fileObj.method,res);
                            }
                            else
                            {
                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [PGSQL] - Record found for File upload %s',fileObj.reqId,JSON.stringify(resUpFile));
                                LocalFileDownloader(dataObj,res);
                            }


                        }

                        /*if(option.toUpperCase()=="MONGO")
                        {

                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Downloading from Mongo',reqId,JSON.stringify(resUpFile));

                            var extArr=resUpFile.FileStructure.split('/');
                            var extension=extArr[1];

                            /!* var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;*!/

                            mongodb.MongoClient.connect(uri, function(error, db)
                            {
                                console.log(uri);
                                if(error)
                                {
                                    logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Error Connecting Mongo cleint '+error,reqId);
                                    res.status(400);
                                    db.close();
                                    res.end();
                                }
                                else
                                {
                                    var bucket = new mongodb.GridFSBucket(db, {
                                        chunkSizeBytes: 1024
                                    });
                                    //res.setHeader('Content-Type', resUpFile.FileStructure);

                                    var source = bucket.openDownloadStreamByName(UUID);
                                    if(isEncryptedFile)
                                    {
                                        console.log("Encrypted file found, Decrypting");
                                        var decrypt = crypto.createDecipher(crptoAlgo, crptoPwd);
                                        console.log("Encrypted file found. Decrypting......");
                                        source.pipe(decrypt).pipe(res).
                                        on('error', function(error) {
                                            console.log('Error !'+error);
                                            decrypt.end();
                                            res.status(400);
                                            db.close();
                                            res.end();
                                            //callback(error,undefined);
                                        }).
                                        on('finish', function() {
                                            console.log('done! piping succeeded');
                                            decrypt.end();
                                            res.status(200);
                                            db.close();
                                            res.end();
                                            //process.exit(0);
                                        });
                                    }
                                    else
                                    {
                                        console.log("File is not Encrypted, Piping Started");
                                        source.pipe(res).
                                        on('error', function(error) {
                                            console.log('Error in Piping!'+error);
                                            res.status(400);
                                            db.close();
                                            res.end();
                                            //callback(error,undefined);
                                        }).
                                        on('finish', function() {
                                            console.log('done! Piping Succeeded');
                                            res.status(200);
                                            db.close();
                                            res.end();
                                            //process.exit(0);
                                        });

                                    }

                                }
                                //console.log("db "+JSON.stringify(db));
                                //assert.ifError(error);


                            });



                        }
                        else if(option.toUpperCase()=="COUCH")
                        {
                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Downloading from Couch',reqId,JSON.stringify(resUpFile));

                            var bucket = cluster.openBucket(Cbucket);

                            bucket.get(UUID, function(err, result) {
                                if (err)
                                {
                                    logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Couch Error ',reqId,err);
                                    res.status(400);
                                    res.end();
                                }else
                                {
                                    console.log(resUpFile.FileStructure);
                                    res.setHeader('Content-Type', resUpFile.FileStructure);
                                    //var SourcePath = (resUpFile.URL.toString()).replace('\',' / '');
                                    //var source = fs.createReadStream(SourcePath);
                                    //var dest = fs.createWriteStream('C:/Users/pawan/Desktop/ddd.mp3');

                                    var source =streamifier.createReadStream(result.value);
                                    if(isEncryptedFile)
                                    {
                                        console.log("Encrypted file found. Decrypting......");
                                        source.pipe(decrypt).pipe(res)
                                            .on('end', function (result) {
                                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Streaming succeeded',reqId);
                                                SaveDownloadDetails(resUpFile,reqId,function(errSv,resSv)
                                                {
                                                    if(errSv)
                                                    {
                                                        logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in Recording downloaded file details',reqId,errSv);
                                                        // callback(errSv,undefined);
                                                    }
                                                    else
                                                    {
                                                        logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Recording downloaded file details succeeded ',reqId);
                                                        //callback(undefined,resSv);
                                                    }
                                                });


                                                console.log("ENDED");
                                                res.status(200);
                                                res.end();
                                            })
                                            .on('error', function (err) {
                                                logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                                console.log("ERROR");
                                                res.status(400);
                                                res.end();
                                            });


                                    }
                                    else
                                    {
                                        console.log("Encrypted file found. Decrypting......");
                                        source.pipe(res)
                                            .on('end', function (result) {
                                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Streaming succeeded',reqId);
                                                SaveDownloadDetails(resUpFile,reqId,function(errSv,resSv)
                                                {
                                                    if(errSv)
                                                    {
                                                        logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in Recording downloaded file details',reqId,errSv);
                                                        // callback(errSv,undefined);
                                                    }
                                                    else
                                                    {
                                                        logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Recording downloaded file details succeeded ',reqId);
                                                        //callback(undefined,resSv);
                                                    }
                                                });


                                                console.log("ENDED");
                                                res.status(200);
                                                res.end();
                                            })
                                            .on('error', function (err) {
                                                logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                                console.log("ERROR");
                                                res.status(400);
                                                res.end();
                                            });


                                    }



                                }

                                //console.log("W is "+JSON.stringify(result.value));
                                // strm.pipe(dest);
                                // {name: Frank}



                            });
                        }
                        else
                        {

                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [PGSQL] - Record found for File upload %s',reqId,JSON.stringify(resUpFile));
                            try {
                                res.setHeader('Content-Type', resUpFile.FileStructure);
                                /!*var SourcePath = (resUpFile.URL.toString()).replace('\',' / '');*!/
                                var SourcePath = path.join(resUpFile.URL.toString());
                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',reqId,SourcePath);

                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',reqId);

                                var source = fs.createReadStream(SourcePath);
                                if(isEncryptedFile)
                                {
                                    var decrypt = crypto.createDecipher(crptoAlgo, crptoPwd);
                                    source.pipe(decrypt).pipe(res)
                                        .on('end', function (result) {
                                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                            decrypt.end();
                                            res.status(200);
                                            res.end();
                                        })
                                        .on('error', function (err) {
                                            logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                            decrypt.end();
                                            res.status(400);
                                            res.end();
                                        });
                                }
                                else
                                {
                                    source.pipe(res)
                                        .on('end', function (result) {
                                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                            res.status(200);
                                            res.end();
                                        })
                                        .on('error', function (err) {
                                            logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                            res.status(400);
                                            res.end();
                                        });
                                }


                            }
                            catch(ex)
                            {
                                logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);

                                // callback(ex, undefined);
                                res.status(400);
                                res.end();
                            }
                        }*/
                    }
                    else
                    {
                        logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - No such file found',fileObj.reqId,FileName);
                        res.status(404);
                        res.end();
                    }

                }).catch(function (errFile) {
                    logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Error in file searching',fileObj.reqId,errFile);
                    res.status(400);
                    res.end();
                });
            }
            else
            {
                logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Max not found',fileObj.reqId);
                res.status(404);
                res.end();
            }
        }).catch(function (errMax) {
            logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Error in Max',fileObj.reqId,errMax);
            res.status(400);
            res.end();
        });





    }
    catch (ex) {
        logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',reqId,FileName);
        //callback(new Error("No record Found for the request"), undefined);
        res.status(400);
        res.end();
    }


}

function LatestFileInfoByID(res,FileName,Company,Tenant,reqId)
{
    try {

        logger.debug('[DVP-FIleService.LatestFileInfoByID] - [%s] - Searching for Uploaded file %s',reqId,FileName);

        DbConn.FileUpload.max('Version',{where: [{Filename: FileName},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resMax) {
            if(resMax)
            {
                DbConn.FileUpload.findOne({where:[{CompanyId:Company},{TenantId:Tenant},{Filename: FileName},{Version:resMax}]}).then(function (resUpFile) {

                    if(resUpFile)
                    {
                        logger.debug('[DVP-FIleService.LatestFileInfoByID] - [%s] - File found FileName %s',reqId,FileName);
                        res.header('ETag', resUpFile.UniqueId);
                        res.header('Last-Modified', resUpFile.updatedAt);
                        res.status(200);
                        res.end();

                    }
                    else
                    {
                        logger.error('[DVP-FIleService.LatestFileInfoByID] - [%s] - File not found FileName %s',reqId,FileName);
                        res.status(404);
                        res.end();
                    }

                }).catch(function (errFile) {
                    logger.error('[DVP-FIleService.LatestFileInfoByID] - [%s] - Error in file searching FileName %s',reqId,FileName,errFile);
                    res.status(400);
                    res.end();
                });
            }
            else
            {
                logger.error('[DVP-FIleService.LatestFileInfoByID] - [%s] - File not found FileName %s',reqId,FileName);
                res.status(404);
                res.end();
            }
        }).catch(function (errMax) {
            logger.error('[DVP-FIleService.LatestFileInfoByID] - [%s] - Error in searching Latest File , FileName %s',reqId,FileName,errMax);
            res.status(400);
            res.end();
        });





    }
    catch (ex) {
        logger.error('[DVP-FIleService.LatestFileInfoByID] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service %s ',reqId,FileName);
        //callback(new Error("No record Found for the request"), undefined);
        res.status(400);
        res.end();
    }
}

function PickVoiceClipByName(FileName,AppID,TenantId,CompanyId,reqId,callback)
{
    if(FileName&&AppID&&!isNaN(AppID))
    {


        DbConn.Application.find({where:[{id:AppID},{CompanyId:CompanyId},{TenantId:TenantId}]}).then(function (resApp) {

            if(resApp)
            {
                CurrentFileVersion(CompanyId,TenantId,AppID,FileName,reqId,function(errVersion,resVersion)
                {
                    if(errVersion)
                    {
                        callback(errVersion,undefined);
                    }
                    else
                    {
                        if(resVersion)
                        {
                            DbConn.FileUpload.find({where:[{TenantId: TenantId},{CompanyId: CompanyId},{ApplicationId:resApp.id},{Version:resVersion},{Filename:FileName}]})
                                .then(function (resFile) {

                                    if(resFile)
                                    {
                                        logger.debug('[DVP-FIleService.PickVoiceClipByName] - [%s] - [PGSQL] - Record found for Application %s  result ',reqId,AppID);
                                        callback(undefined,resFile);
                                    }
                                    else
                                    {
                                        logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] - [PGSQL] - No record found for Application %s  ',reqId,AppID);
                                        callback(new Error("No record found for Application"),undefined);
                                    }

                                }).catch(function (errFile) {
                                logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] - [PGSQL] - Error occurred while searching for Application %s  ',reqId,AppID,errFile);
                                callback(errFile,undefined);
                            });



                        }
                        else
                        {
                            callback(new Error("No such File found"),undefined);
                        }
                    }
                })
            }
            else
            {
                callback(new Error("No Such Application"),undefined);
            }

        }).catch(function (errApp) {

            logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] - [PGSQL] - Error occurred while searching for Application %s  ',reqId,AppID,errApp);
            callback(new Error("No application found"),undefined);

        });


    }
    else
    {
        callback(new Error("Invalid inputs"),undefined);
    }



};

function CurrentFileVersion(Company,Tenant,AppID,FileName,reqId,callback)
{
    try
    {
        logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - Searching for current version  File of %s',reqId,FileName);

        DbConn.FileUpload.max('Version',{where: [{Filename: FileName},{CompanyId:Company},{TenantId:Tenant},{ApplicationId:AppID}]})
            .then(function (resMax) {

                if(resMax)
                {


                    logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] - Old version of %s is found and New version updated',reqId,FileName);
                    callback(undefined,parseInt(resMax));
                }
                else{
                    logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] -  Version of % is not found and New version will be %d',reqId,FileName,1);
                    callback(undefined,0);
                }

            }).catch(function (errMax) {
            logger.error('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] - Error occurred while searching for current version of %s',reqId,FileName,errMax);
            callback(errMax,undefined);
        });




    }
    catch (ex)
    {
        logger.error('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - Exception occurred when start searching current version of %s',reqId,ex);
        callback(ex,undefined);
    }
}
function PickFileInfo(appid,Company,Tenant,reqId,callback)
{
    if(appid&&!isNaN(appid))
    {
        try
        {
            DbConn.FileUpload.findAll({where:[{ApplicationId:appid},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resFile) {

                if(!resFile)
                {
                    callback(new Error("No file"),undefined);
                }
                else
                {
                    callback(undefined,resFile);
                }

            }).catch(function (errFile) {
                callback(errFile,undefined);
            });



        }
        catch(ex)
        {
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("Undefined Application ID"),undefined);
    }


}
function PickFileWithAppID(UUID,appid,Company,Tenant,reqId,callback)
{

    if(UUID&&appid&&!isNaN(appid))
    {
        try
        {
            DbConn.FileUpload.find({where:[{UniqueId:UUID},{ApplicationId:appid},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resFile) {

                if(!resFile)
                {
                    callback(new Error("No file"),undefined);
                }
                else
                {
                    callback(undefined,resFile);
                }

            }).catch(function (errFile) {
                callback(errFile,undefined);
            });




        }
        catch(ex)
        {
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("UUID or AppID is undefined"),undefined);
    }

}
function PickAllVoiceRecordingsOfSession(SessID,Company,Tenant,reqId,callback) {
    try {
        DbConn.FileUpload.findAll({where: [{RefId: SessID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (result) {

            if(result.length==0)
            {
                callback(new Error("No records found"),undefined);
            }
            else
            {
                callback(undefined, result);
            }

        }).catch(function (err) {
            callback(err, undefined);
        });

    }

    catch (ex) {
        callback(ex, undefined);
    }


}

function AllVoiceRecordingsOfSessionAndTypes(SessID,Class,Type,Category,Company,Tenant,reqId,callback) {
    try {
        DbConn.FileUpload.findAll({where: [{RefId: SessID},{ObjClass: Class},{ObjType: Type},{ObjCategory: Category},{CompanyId:Company},{TenantId:Tenant}]})
            .then(function (result) {
                if(result.length==0)
                {
                    callback(new Error("No record found"),undefined);
                }
                else
                {
                    callback(undefined,result);
                }
            }).catch(function (err) {
            callback(err, undefined);
        });

    }


    catch (ex) {
        callback(ex, undefined);
    }


}

function AllFilesWithCategory(Category,Company,Tenant,reqId,callback) {
    try {


        DbConn.FileUpload.findAll({where: [{ObjCategory: Category},{CompanyId:Company},{TenantId:Tenant}]})
            .then(function (result) {
                if(result.length==0)
                {
                    callback(new Error("No record found"),undefined);
                }
                else
                {
                    callback(undefined,result);
                }
            }).catch(function (err) {
            callback(err, undefined);
        });

    }


    catch (ex) {
        callback(ex, undefined);
    }


};

function FilesWithCategoryId(CategoryID,Company,Tenant,reqId,callback) {
    try {


        if(parseInt(CategoryID)<0)
        {
            DbConn.FileUpload.findAll({where: [{CompanyId:Company},{TenantId:Tenant}]})
                .then(function (result) {
                    if(result.length==0)
                    {
                        callback(new Error("No record found"),undefined);
                    }
                    else
                    {
                        callback(undefined,result);
                    }
                }).catch(function (err) {
                callback(err, undefined);
            });
        }
        else
        {
            DbConn.FileUpload.findAll({where: [{FileCategoryId: CategoryID},{CompanyId:Company},{TenantId:Tenant}]})
                .then(function (result) {
                    if(result.length==0)
                    {
                        callback(new Error("No record found"),undefined);
                    }
                    else
                    {
                        callback(undefined,result);
                    }
                }).catch(function (err) {
                callback(err, undefined);
            });
        }



    }


    catch (ex) {
        callback(ex, undefined);
    }


};

function FilesWithCategoryAndDateRange(CategoryID,Company,Tenant,startDate,endDate,reqId,callback) {
    try {

        console.log("Start Time"+startDate);
        console.log("End Time"+endDate);

        var stratDateTime = startDate;
        var endDateTime = endDate;
        //console.log(stratDateTime);

        //var stratDateTime = new Date(startDate);
        //var endDateTime = new Date(endDate);

        if(parseInt(CategoryID)>0)
        {
            var conditionalData = {
                createdAt: {
                    gte: stratDateTime,
                    lte:endDateTime
                },
                FileCategoryId:CategoryID,
                CompanyId :  Company,
                TenantId: Tenant
            };
        }
        else
        {
            var conditionalData = {
                createdAt: {
                    gte: stratDateTime,
                    lte:endDateTime
                },
                CompanyId :  Company,
                TenantId: Tenant
            };
        }



        DbConn.FileUpload.findAll({where:conditionalData})
            .then(function (result) {
                if(result.length==0)
                {
                    callback(new Error("No record found"),undefined);
                }
                else
                {
                    callback(undefined,result);
                }
            }).catch(function (err) {
            callback(err, undefined);
        });

    }


    catch (ex) {
        callback(ex, undefined);
    }


}

function FilesWithCategoryListAndDateRange(req,Company,Tenant,startDate,endDate,reqId,callback) {
    try {

        console.log("Start Time"+startDate);
        console.log("End Time"+endDate);

        var stratDateTime = startDate;
        var endDateTime = endDate;
        //console.log(stratDateTime);

        //var stratDateTime = new Date(startDate);
        //var endDateTime = new Date(endDate);




        if(req.body.categoryList.length>0)
        {

            var conditionalData = {
                createdAt: {
                    gte: stratDateTime,
                    lte:endDateTime
                },
                CompanyId :  Company,
                TenantId: Tenant,
                $or:[]
            };

            req.body.categoryList.forEach(function (item) {
                conditionalData.$or.push({ObjCategory:item})
            });


            if(req.params.rowCount && req.params.pageNo)
            {


                DbConn.FileUpload.findAll({where:[conditionalData],offset:((req.params.pageNo - 1) * req.params.rowCount),
                    limit: req.params.rowCount,
                    order: '"updatedAt" DESC'})
                    .then(function (result) {
                        if(result.length==0)
                        {
                            callback(new Error("No record found"),undefined);
                        }
                        else
                        {
                            callback(undefined,result);
                        }
                    }).catch(function (err) {
                    callback(err, undefined);
                });


            }
            else
            {
                DbConn.FileUpload.findAll({where:conditionalData})
                    .then(function (result) {
                        if(result.length==0)
                        {
                            callback(new Error("No record found"),undefined);
                        }
                        else
                        {
                            callback(undefined,result);
                        }
                    }).catch(function (err) {
                    callback(err, undefined);
                });
            }






        }
        else
        {
            callback(new Error("No record found"),undefined);
        }


    }


    catch (ex) {
        callback(ex, undefined);
    }


}

function FilesWithCategoryList(req,Company,Tenant,reqId,callback) {
    try {

        var conditionalData = {

            CompanyId :  Company,
            TenantId: Tenant,
            $or:[]
        };






        if(req.body.categoryList)
        {

            req.body.categoryList.forEach(function (item) {
                conditionalData.$or.push({ObjCategory:item})
            });


        }




        if(req.body.categoryList.length>0)
        {

            if(req.params.rowCount && req.params.pageNo)
            {



                DbConn.FileUpload.findAll({ where:[conditionalData],
                    offset:((req.params.pageNo - 1) * req.params.rowCount),
                    limit: req.params.rowCount,
                    order: '"updatedAt" DESC'})
                    .then(function (result) {
                        if(result.length==0)
                        {
                            callback(new Error("No record found"),undefined);
                        }
                        else
                        {
                            callback(undefined,result);
                        }
                    }).catch(function (err) {
                    callback(err, undefined);
                });


            }
            else
            {
                DbConn.FileUpload.findAll({where:conditionalData})
                    .then(function (result) {
                        if(result.length==0)
                        {
                            callback(new Error("No record found"),undefined);
                        }
                        else
                        {
                            callback(undefined,result);
                        }
                    }).catch(function (err) {
                    callback(err, undefined);
                });
            }




        }
        else
        {
            callback(new Error("No record found"),undefined);
        }




    }


    catch (ex) {
        callback(ex, undefined);
    }


}

function AllFilesWithCategoryAndDateRange(Category,Company,Tenant,startDate,endDate,reqId,callback) {
    try {

        var stratDateTime = new Date(startDate);
        var endDateTime = new Date(endDate);

        var conditionalData = {
            createdAt: {
                gt: stratDateTime,
                lt:endDateTime
            },
            ObjCategory:Category,
            CompanyId :  Company,
            TenantId: Tenant
        };


        DbConn.FileUpload.findAll({where:conditionalData})
            .then(function (result) {
                if(result.length==0)
                {
                    callback(new Error("No record found"),undefined);
                }
                else
                {
                    callback(undefined,result);
                }
            }).catch(function (err) {
            callback(err, undefined);
        });

    }


    catch (ex) {
        callback(ex, undefined);
    }


};

function AllFilesWithCategoryID(CategoryID,rowCount,pageNo,Company,Tenant,reqId,callback) {
    try {


        DbConn.FileUpload.findAll({
            where: [{FileCategoryId: CategoryID},{CompanyId:Company},{TenantId:Tenant}],
            offset:((pageNo - 1) * rowCount),
            limit: rowCount,
            include:[{model:DbConn.FileCategory, as:"FileCategory"},{model:DbConn.Application, as:"Application"}],

        })
            .then(function (result) {
                if(result.length==0)
                {
                    callback(new Error("No record found"),undefined);
                }
                else
                {
                    callback(undefined,result);
                }
            }).catch(function (err) {
            callback(err, undefined);
        });

    }


    catch (ex) {
        callback(ex, undefined);
    }


};

function PickAllFiles(Company,Tenant,isVisibleCat,reqId,callback)
{

    try
    {
        var CategoryObj =
            {
                model:DbConn.FileCategory,
                as:"FileCategory"
            }

        if(isVisibleCat)
        {
            CategoryObj.where=
                {
                    Visible:isVisibleCat
                }

        }

        DbConn.FileUpload.findAll({where:[{CompanyId:Company},{TenantId:Tenant}],include:[CategoryObj,{model:DbConn.Application, as:"Application"}]}).then(function (resFile) {


            callback(undefined,resFile);


        }).catch(function (errFile) {
            callback(errFile,undefined);
        });


    }
    catch(ex)
    {
        callback(ex,undefined);
    }



}

function PickFilesByCategoryList(rowCount,pageNo,Company,Tenant,req,reqId,callback)
{

    var categoryList = req.body.categoryList;

    if(categoryList.length>0)
    {
        try
        {
            var CategoryObj =
                {
                    model:DbConn.FileCategory,
                    as:"FileCategory"
                }




            var conditionObj = {
                CompanyId:Company,
                TenantId:Tenant,
                $or:[]
            };

            categoryList.forEach(function (item) {
                conditionObj.$or.push({ObjCategory:item})
            });




            DbConn.FileUpload.findAll({

                where:conditionObj,
                offset:((pageNo - 1) * rowCount),
                limit: rowCount
                ,include:[CategoryObj,{model:DbConn.Application, as:"Application"}]}).then(function (resFile) {


                callback(undefined,resFile);


            }).catch(function (errFile) {
                callback(errFile,undefined);
            });


        }
        catch(ex)
        {
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("No files to show"),undefined);
    }






}

function PickSpecifiedFiles(fileCategory,fileFormat,Company,Tenant,isVisibleCat,reqId,callback)
{

    try
    {
        var CategoryObj =
            {
                model:DbConn.FileCategory,
                as:"FileCategory"
            }

        if(isVisibleCat)
        {
            CategoryObj.where=
                {
                    Visible:isVisibleCat
                }

        }

        DbConn.FileUpload.findAll({where:[{CompanyId:Company},{TenantId:Tenant},{ObjCategory:fileCategory},{FileStructure:fileFormat},{ApplicationId:null}],include:[CategoryObj,{model:DbConn.Application, as:"Application"}]}).then(function (resFile) {


            callback(undefined,resFile);


        }).catch(function (errFile) {
            callback(errFile,undefined);
        });


    }
    catch(ex)
    {
        callback(ex,undefined);
    }



};

function PickCategorySpecifiedFiles(fileCategory,fileFormat,Company,Tenant,isVisibleCat,reqId,callback)
{

    try
    {
        var CategoryObj =
            {
                model:DbConn.FileCategory,
                as:"FileCategory"
            }

        if(isVisibleCat)
        {
            CategoryObj.where=
                {
                    Visible:isVisibleCat
                }

        }

        DbConn.FileUpload.findAll({where:[{CompanyId:Company},{TenantId:Tenant},{ObjCategory:fileCategory},{FileStructure:fileFormat}],include:[CategoryObj]}).then(function (resFile) {


            callback(undefined,resFile);


        }).catch(function (errFile) {
            callback(errFile,undefined);
        });


    }
    catch(ex)
    {
        callback(ex,undefined);
    }



};

function PickAllFilesWithPaging(rowCount,pageNo,Company,Tenant,isVisibleCat,reqId,callback)
{

    try
    {
        var categoryObj=
            {
                model:DbConn.FileCategory,
                as:"FileCategory"
            }

        if(isVisibleCat)
        {
            categoryObj.where =
                {
                    Visible:true
                }
        }

        DbConn.FileUpload.findAll({
            where:[{CompanyId:Company},{TenantId:Tenant}],
            offset:((pageNo - 1) * rowCount),
            limit: rowCount,
            include:[categoryObj,{model:DbConn.Application, as:"Application"}],
            order: '"updatedAt" DESC'


        }).then(function (resFile) {


            callback(undefined,resFile);


        }).catch(function (errFile) {
            callback(errFile,undefined);
        });


    }
    catch(ex)
    {
        callback(ex,undefined);
    }



}

function PickUnassignedFilesWithPaging(Company,Tenant,reqId,callback)
{

    try
    {
        DbConn.FileUpload.findAll({
            where:[{CompanyId:Company},{TenantId:Tenant},{ApplicationId:null}],
            include:[{model:DbConn.FileCategory, as:"FileCategory"},{model:DbConn.Application, as:"Application"}]


        }).then(function (resFile) {


            callback(undefined,resFile);


        }).catch(function (errFile) {
            callback(errFile,undefined);
        });


    }
    catch(ex)
    {
        callback(ex,undefined);
    }



}

function LocalFileRemover(resFile,Company,Tenant,callback) {

    var URL = path.join(resFile.URL);
    fs.unlink(URL,function(err){
        if(err)
        {
            console.log(err);
            callback(err,undefined);
        }
        else
        {
            RedisPublisher.UpdateFileStorageRecords("RELEASE",resFile.ObjCategory,resFile.Size,Company,Tenant);

            if(resFile.FileStructure && resFile.FileStructure.split("/")[0]=="image")
            {
                var thumbDir = path.join(config.BasePath,"Company_"+Company.toString()+"_Tenant_"+Tenant.toString(),resFile.ObjCategory+"_thumb",year.toString()+"-"+month.toString()+"-"+date.toString());
                fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_75").toString()));
                fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_100").toString()));
                fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_125").toString()));
                fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_150").toString()));
                fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_200").toString()));
            }
            else
            {
                console.log("Error in removing Thumbnails of deleted file");
            }


            resFile.destroy().then(function (resDel) {
                callback(undefined,resDel);
            }).catch(function (errDel) {
                callback(errDel,undefined);
            });
        }


    });

}

function MongoFileRemover(resFile,Company,Tenant,callback) {
    mongodb.MongoClient.connect(uri, function(error, db)
    {
        if(error)
        {
            console.log("DB Opening Error");
            db.close();
            callback(error,undefined);
        }
        else
        {
            db.collection(config.Collection).deleteOne(
                { "filename": resFile.UniqueId },
                function(err, results) {
                    //console.log(results);
                    if(err)
                    {
                        console.log("Deletion Error");
                        db.close();
                        callback(err,undefined);
                    }
                    else
                    {
                        RedisPublisher.UpdateFileStorageRecords("RELEASE",resFile.ObjCategory,resFile.Size,Company,Tenant);
                        resFile.destroy().then(function (resDel) {
                            console.log("Record destroy success");
                            db.close();
                            callback(undefined,resDel);
                        }).catch(function (errDel) {
                            console.log("Record destroy error");
                            db.close();
                            callback(errDel,undefined);
                        });
                    }

                }
            );
        }
    });
}


function DeleteFile(fileID,Company,Tenant,option,reqId,callback)

{
    try
    {
        PickAttachmentMetaData(fileID,Company,Tenant,reqId, function (errFile,resFile) {

            if(errFile)
            {
                console.log("Metadata Error");
                callback(errFile,undefined);
            }
            else
            {
                var Today= new Date();
                var date= Today.getDate();
                var month=Today.getMonth()+1;
                var year =Today.getFullYear();





                if(resFile && resFile.URL)
                {
                    resFile.date=date;
                    resFile.month=month;
                    resFile.year=year;


                    if(resFile.Source=="LOCAL")
                    {
                        LocalFileRemover(resFile,Company,Tenant,function (errDel,resDel) {
                            callback(errDel,resDel);
                        });
                    }
                    else if(resFile.Source=="MONGO")
                    {
                        MongoFileRemover(resFile,Company,Tenant,function (errDel,resDel) {
                            callback(errDel,resDel);
                        });
                    }
                    else
                    {
                        if(option.toUpperCase()=="MONGO")
                        {
                            MongoFileRemover(resFile,Company,Tenant,function (errDel,resDel) {
                                callback(errDel,resDel);
                            });
                        }
                        else
                        {
                            LocalFileRemover(resFile,Company,Tenant,function (errDel,resDel) {
                                callback(errDel,resDel);
                            });
                        }
                    }

                }
                else
                {
                    callback(new Error("No File record found to delete "+fileID),undefined);
                }



               /* if(option.toUpperCase()=="LOCAL")
                {
                    console.log("File operations on LOCAL ");
                    if(resFile.URL)
                    {
                        var URL = path.join(resFile.URL);
                        fs.unlink(URL,function(err){
                            if(err)
                            {
                                console.log(err);
                                callback(err,undefined);
                            }
                            else
                            {
                                RedisPublisher.UpdateFileStorageRecords("RELEASE",resFile.ObjCategory,resFile.Size,Company,Tenant);

                                if(resFile.FileStructure && resFile.FileStructure.split("/")[0]=="image")
                                {
                                    var thumbDir = path.join(config.BasePath,"Company_"+Company.toString()+"_Tenant_"+Tenant.toString(),resFile.ObjCategory+"_thumb",year.toString()+"-"+month.toString()+"-"+date.toString());
                                    fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_75").toString()));
                                    fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_100").toString()));
                                    fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_125").toString()));
                                    fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_150").toString()));
                                    fs.unlink(path.join(thumbDir,(resFile.UniqueId+"_200").toString()));
                                }
                                else
                                {
                                    console.log("Error in removing Thumbnails of deleted file");
                                }


                                resFile.destroy().then(function (resDel) {
                                    callback(undefined,resDel);
                                }).catch(function (errDel) {
                                    callback(errDel,undefined);
                                });
                            }


                        });
                    }
                    else
                    {
                        console.log("No file path found");
                        callback(new Error(""),undefined);
                    }

                }
                else
                {
                    if(option.toUpperCase()=="MONGO")
                    {
                        /!*var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;*!/
                        mongodb.MongoClient.connect(uri, function(error, db)
                        {
                            if(error)
                            {
                                console.log("DB Opening Error");
                                db.close();
                                callback(error,undefined);
                            }
                            else
                            {
                                db.collection(config.Collection).deleteOne(
                                    { "filename": fileID },
                                    function(err, results) {
                                        //console.log(results);
                                        if(err)
                                        {
                                            console.log("Deletion Error");
                                            db.close();
                                            callback(err,undefined);
                                        }
                                        else
                                        {
                                            RedisPublisher.UpdateFileStorageRecords("RELEASE",resFile.ObjCategory,resFile.Size,Company,Tenant);
                                            resFile.destroy().then(function (resDel) {
                                                console.log("Record destroy success");
                                                db.close();
                                                callback(undefined,resDel);
                                            }).catch(function (errDel) {
                                                console.log("Record destroy error");
                                                db.close();
                                                callback(errDel,undefined);
                                            });
                                        }

                                    }
                                );
                            }
                        });
                    }
                    else
                    {
                        callback(new Error("Invalid DB Option"),undefined);
                    }
                }*/
            }

        });

    }
    catch(ex)
    {
        console.log("Exception");
        callback(ex,undefined);

    }





}

function  SaveNewCategory(categoryData,reqId,callback)
{

    try {
        var CatObject = DbConn.FileCategory
            .build(
                {
                    Category: categoryData.Category,
                    Owner: "user",
                    Visible: categoryData.Visible,
                    Encripted: categoryData.Encripted


                }
            )
    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.SaveNewCategory] - [%s] - [FILECATEGORY] - Exception occurred while creating file category',reqId,ex);
        callback(ex, undefined);
    }

    CatObject.save().then(function (resSave) {

        logger.info('[DVP-FIleService.SaveNewCategory] - [%s] - [PGSQL] - Save new file category succeeded %s',reqId,resSave);
        callback(undefined, resSave);

    }).catch(function (errSave) {
        logger.error('[DVP-FIleService.SaveNewCategory] - [%s] - [PGSQL] - Error occurred while saving file category %s',reqId,JSON.stringify(CatObject),errSave);
        callback(errSave, undefined);
    });
}

function  LoadCategories(reqId,callback)
{
    try
    {
        DbConn.FileCategory.findAll({where:[{Visible:true}]}).then(function (resFile) {


            callback(undefined,resFile);


        }).catch(function (errFile) {
            callback(errFile,undefined);
        });



    }
    catch(ex)
    {
        callback(ex,undefined);
    }
}




function PickFileCountsOFCategories(catID,company,tenant,callback) {

    DbConn.FileCategory.find({where: [{id: catID}]}).then(function (resCat) {

        if (!resCat) {
            console.log("No cat");
            callback(new Error("No Category found"), undefined);
        }
        else
        {
            DbConn.FileUpload.count({where: ['"FileCategoryId" = '+ catID.toString(),{CompanyId:company},{TenantId:tenant}]}).then(function (resCount) {


                console.log(resCount+"Files found for category");
                var CatObj ={};
                CatObj['ID']=catID;
                CatObj['Category']=resCat.Category;
                CatObj['Count']=resCount;

                callback(undefined,CatObj);


            }).catch(function (errCount) {
                console.log("Err count");
                console.log(errCount);
                callback(errCount, undefined);
            });
        }


    }).catch(function (errCat) {
        console.log("err cat");
        callback(errCat, undefined);
    });


}


function GetFileDetails(req, res){

    logger.info("DVP-FileService.GetFileDetails Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    if(req.query && req.query['from']&& req.query['to']) {
        var from = req.query['from'];
        var to = req.query['to'];

        try {
            from = new Date(from);
            to = new Date(to);
        }catch(ex){
            jsonString = messageFormatter.FormatMessage(ex, "From and To dates are require", false, undefined);
            res.end(jsonString);
            return;
        }

        if(from > to){

            jsonString = messageFormatter.FormatMessage(undefined, "From should less than To", false, undefined);
            res.end(jsonString);
            return;

        }

        var tempQuery = {company: company, tenant: tenant};

        tempQuery['created_at'] = { $gte: from, $lte: to };

        if(req.body){

            if(req.body.tag){
                tempQuery.isolated_tags = {$in: [req.body.tag]};
            }

            if(req.body.channel){
                tempQuery.channel =  req.body.channel;
            }

            if(req.body.priority){
                tempQuery.priority = req.body.priority;
            }

            if(req.body.type){
                tempQuery.type = req.body.type;
            }

        }

        var aggregator = [

            {
                $match: tempQuery,

            },
            {
                $group: {
                    _id: 0,
                    count: {
                        $sum: 1
                    },
                    reopen: {
                        $sum: {
                            $cond: ['$ticket_matrix.reopens', 1, 0]
                        }
                    },
                    sla_violated: {
                        $sum: {
                            $cond: ['$ticket_matrix.sla_violated', 1, 0]
                        }
                    },
                    first_call_resolved: {
                        $sum: {
                            $cond: ['$ticket_matrix.external_replies', 1, 0]
                        }
                    },
                    new: {
                        $sum: {
                            $cond: [{$eq:["$status","new"]}, 1, 0]
                        }
                    },
                    progressing: {
                        $sum: {
                            $cond: [{$or:[{$eq:["$status","open"]},{$eq:["$status","progressing"]}]}, 1, 0]
                        }
                    },closed: {
                        $sum: {
                            $cond: [{$eq:["$status","closed"]}, 1, 0]
                        }
                    },resolved: {
                        $sum: {
                            $cond: [{$eq:["$status","solved"]}, 1, 0]
                        }
                    },first_call_resolved: {
                        $sum: {
                            $cond: [{$eq:['$ticket_matrix.external_replies',0]}, 1, 0]
                        }
                    },
                    overdue_done: {
                        $sum: {
                            $cond: [{$and : [{$gt: ["$ticket_matrix.solved_at", "$due_at" ]}, {$eq:["$status","closed"]}]}, 1, 0]
                        }
                    },
                    overdue_working: {
                        $sum: {
                            $cond: [{$and : [{$gt: [ new Date(), "$due_at" ]}, {$and:[{$ne:["$status","closed"]},{$ne:["$status","solved"]}]}]}, 1, 0]
                        }
                    },
                    average_response: {
                        $avg: {

                            $cond: [{$ne:["$status","new"]}, "$ticket_matrix.waited_time", null]

                        }
                    },
                    average_resolution: {

                        $avg: {

                            $cond: [{$and : [{$eq:["$status","closed"]},{$eq:["$status","solved"]}]}, "$ticket_matrix.resolution_time", null]

                        }
                    }
                }
            },{
                $project: {
                    _id: 0,
                    statistics: {
                        total: '$count',
                        reopen: '$reopen',
                        sla_violated: '$sla_violated',
                        first_call_resolved: '$first_call_resolved',
                        average_response: '$average_response',
                        average_resolution: '$average_resolution',
                        overdue_done: '$overdue_done',
                        overdue_working: '$overdue_working',
                        new: '$new',
                        progressing: '$progressing',
                        closed: '$closed',
                        resolved: '$resolved'
                    }

                }
            }
        ];

        Ticket.aggregate( aggregator, function (err, tickets) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Get All Tickets Failed", false, undefined);
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get All Tickets Successful", true, tickets);
            }
            res.end(jsonString);
        });

    }else{

        jsonString = messageFormatter.FormatMessage(undefined, "From and To dates are require", false, undefined);
        res.end(jsonString);
    }

}



module.exports.PickAttachmentMetaData = PickAttachmentMetaData;
module.exports.DownloadFileByID = DownloadFileByID;
module.exports.PickVoiceClipByName = PickVoiceClipByName;
module.exports.PickFileInfo = PickFileInfo;
module.exports.PickFileWithAppID = PickFileWithAppID;
module.exports.PickAllVoiceRecordingsOfSession = PickAllVoiceRecordingsOfSession;
module.exports.AllVoiceRecordingsOfSessionAndTypes = AllVoiceRecordingsOfSessionAndTypes;
module.exports.PickAllFiles = PickAllFiles;
module.exports.DeleteFile = DeleteFile;
module.exports.LoadCategories = LoadCategories;
module.exports.FileInfoByID = FileInfoByID;
module.exports.DownloadLatestFileByID = DownloadLatestFileByID;
module.exports.LatestFileInfoByID = LatestFileInfoByID;
module.exports.AllFilesWithCategory = AllFilesWithCategory;
module.exports.AllFilesWithCategoryID = AllFilesWithCategoryID;
module.exports.PickFileCountsOFCategories = PickFileCountsOFCategories;
module.exports.PickAllFilesWithPaging = PickAllFilesWithPaging;
module.exports.PickUnassignedFilesWithPaging = PickUnassignedFilesWithPaging;
module.exports.PickSpecifiedFiles = PickSpecifiedFiles;
module.exports.PickCategorySpecifiedFiles = PickCategorySpecifiedFiles;
module.exports.AllFilesWithCategoryAndDateRange = AllFilesWithCategoryAndDateRange;
module.exports.FilesWithCategoryId = FilesWithCategoryId;
module.exports.FilesWithCategoryAndDateRange = FilesWithCategoryAndDateRange;
module.exports.PickAttachmentMetaDataByName = PickAttachmentMetaDataByName;
module.exports.SaveNewCategory = SaveNewCategory;
module.exports.PickFilesByCategoryList = PickFilesByCategoryList;
module.exports.FilesWithCategoryListAndDateRange = FilesWithCategoryListAndDateRange;
module.exports.FilesWithCategoryList = FilesWithCategoryList;
module.exports.GetFileDetails = GetFileDetails;








