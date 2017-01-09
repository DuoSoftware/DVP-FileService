//var attachmate = require('attachmate');
var fstream = require('fstream');
var path = require('path');
var uuid = require('node-uuid');
var DbConn = require('dvp-dbmodels');
var config = require('config');
var sequelize = require('sequelize');

//Sprint 5
var couchbase = require('couchbase');
var streamifier = require('streamifier');
var Cbucket=config.Couch.bucket;
var CHip=config.Couch.ip;
var cluster = new couchbase.Cluster("couchbase://"+CHip);
//


//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
//var couchbase = require('couchbase');
var sys=require('sys');
var express    =       require("express");
var multer     =       require('multer');
var app        =       express();
var done       =       false;
var fs=require('fs');
var log4js=require('log4js');

var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var config = require('config');
var mongodb = require('mongodb');

var moment= require('moment');
var easyimg = require('easyimage');




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




var MIP = config.Mongo.ip;
var MPORT=config.Mongo.port;
var MDB=config.Mongo.dbname;


var config = require('config');

var hpath=config.Host.hostpath;


log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("fhandler");



var CatObj={};

log.info('\n.............................................File handler Starts....................................................\n');

/*
 var bucket = new couchbase.Connection({
 'bucket':'ScheduledObjects',
 'host':'http://192.168.1.20:8092'
 }, function(err) {
 if (err) {
 // Failed to make a connection to the Couchbase cluster.
 throw err;
 }

 bucket.get('newtest005', function(err, result) {
 if (err) {
 // Failed to retrieve key
 throw err;
 }

 var doc = result.value;

 console.log(doc.name + ', ABV: ' );//+ doc.abv);

 doc.comment = "Random beer from Norway";

 bucket.replace('newtest005', doc, function(err, result) {
 if (err) {
 // Failed to replace key
 throw err;
 }

 console.log(result);

 // Success!
 process.exit(0);
 });
 });
 });

 */

//var rand=null;


/*RecordDownloadFileDetails(0,function()
 {

 });*/









function RecordDownloadFileDetails(req, callback) {
    var outputPath = path.resolve(__dirname, 'b2');


    /*mkdirp(outputPath, function (err) {
     if (err) return;

     var w = fstream.Writer({
     path: outputPath,
     type: 'Directory'
     });


     var r = fstream.Reader({
     type: attachmate.Reader,
     path: 'http://192.168.1.20:8092/ScheduledObjects/duo'
     });



     // pipe the attachments to the directory
     r.pipe(w);
     });*/

    /* mkdirp(outputPath, function(err) {
     if (err) return;

     attachmate.download(
     'http://192.168.1.20:8092/ScheduledObjects/newtest005',
     outputPath,
     function(err) {
     console.log('done, error = ', err);
     }
     );
     });

     */


}


function UploadFile(req,res)
{
    var fileKey = Object.keys(req.files)[0];
    var file = req.files[fileKey];

//var strct=file.type;
    // var path=file.path;

    SaveUploadFileDetails(file,res);
    //console.log(file);



    // req.end();
}

//log done...............................................................................................................
function SaveUploadFileDetails(cmp,ten,req,rand2,reqId,callback)
{

    try {
        var DisplyArr = req.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];
    }
    catch(ex)
    {
        callback(ex,undefined);
    }



    try {
        DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).then(function (resFile) {

            if (resFile) {
                logger.error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - File is already uploaded %s',reqId,JSON.stringify(resFile));
                callback(new Error("Already in DB"), undefined);
            }

            else {

                logger.info('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - New upload file record is inserting %s',reqId);
                var NewUploadObj = DbConn.FileUpload
                    .build(
                    {
                        UniqueId: rand2,
                        FileStructure: req.type,
                        ObjClass: 'body.ObjClass',
                        ObjType: 'body.ObjType',
                        ObjCategory: 'body.ObjCategory',
                        URL: req.path,
                        UploadTimestamp: Date.now(),
                        Filename: DisplayName,
                        Version:req.Version,
                        DisplayName:req.name ,
                        CompanyId:cmp,
                        TenantId: ten


                    }
                );
                NewUploadObj.save().then(function (resFileSave) {

                    logger.info('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - New upload record added successfully %s',reqId,JSON.stringify(NewUploadObj));
                    callback(undefined, resFileSave.UniqueId);

                }).catch(function (errFileSave) {
                    logger.Error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Error in saving Upload file record %s',reqId,JSON.stringify(NewUploadObj));
                    callback(errFileSave, undefined);
                });





            }

        }).catch(function (errFile) {
            logger.error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Error occurred while searching for Uploaded file record ',reqId,errFile);
            callback(errFile,undefined);
        });


    }
    catch (ex) {
        logger.Error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Exception occurred while calling File upload search ',reqId,ex);
        callback(ex, undefined);
    }


}

function downF()
{
    var source = fs.createReadStream('C:/Users/pawan/Desktop/bc9783386be9de59d68bc576c9726de9');
    var dest = fs.createWriteStream('C:/Users/pawan/Desktop/apssd');

    source.pipe(dest);
    source.on('end', function() { /* copied */ });
    source.on('error', function(err) { /* error */ });
}
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
function DownloadFileByID(res,UUID,display,option,Company,Tenant,reqId,callback)
{
    if(UUID)
    {
        try {

            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Searching for Uploaded file %s',reqId,UUID);
            DbConn.FileUpload.find({where: [{UniqueId: UUID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resUpFile) {

                if (resUpFile) {

                    var resObj=
                    {
                        "Last-Modified":resUpFile.createdAt,
                        "ETag":resUpFile.UniqueId+":"+"display"+":"+resUpFile.Version
                    };

                    if(option=="MONGO")
                    {

                        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [MONGO] - Downloading from Mongo',reqId,JSON.stringify(resUpFile));

                        var extArr=resUpFile.FileStructure.split('/');
                        var extension=extArr[1];

                        var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;

                        mongodb.MongoClient.connect(uri, function(error, db)
                        {
                            console.log(uri);
                            console.log("Error1 "+error);
                            if(error)
                            {
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

                                bucket.openDownloadStreamByName(UUID).
                                    pipe(res).
                                    on('error', function(error) {
                                        console.log('Error !'+error);
                                        res.status(400);
                                        db.close();
                                        res.end();
                                        //callback(error,undefined);
                                    }).
                                    on('finish', function() {
                                        console.log('done!');
                                        res.status(200);
                                        db.close();
                                        res.end();
                                        //process.exit(0);
                                    });
                            }
                            //console.log("db "+JSON.stringify(db));
                            //assert.ifError(error);


                        });



                    }
                    else if(option=="COUCH")
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
                                //console.log(s);
                                s.pipe(res);


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
                                });
                                s.on('error', function (err) {
                                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                    console.log("ERROR");
                                    res.status(400);
                                    res.end();
                                });

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
                            var SourcePath = (resUpFile.URL.toString()).replace('\',' / '');
                            logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',reqId,SourcePath);

                            logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',reqId);
                            var source = fs.createReadStream(SourcePath);

                            source.pipe(res);
                            source.on('end', function (result) {
                                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                res.status(200);
                                res.end();
                            });
                            source.on('error', function (err) {
                                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                res.status(400);
                                res.end();
                            });
                        }
                        catch(ex)
                        {
                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);

                            callback(ex, undefined);
                            res.status(400);
                            res.end();
                        }
                    }

                }

                else {
                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - No record found for  Uploaded file  %s',reqId,UUID);
                    callback(new Error('No record for id : ' + UUID), undefined);
                    res.status(404);
                    res.end();

                }

            }).catch(function (errUpFile) {

                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while searching Uploaded file  %s',reqId,UUID,errUpFile);
                callback(errUpFile, undefined);
                res.status(400);
                res.end();

            });



        }
        catch (ex) {
            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',reqId,UUID);
            callback(new Error("No record Found for the request"), undefined);
            res.status(400);
            res.end();
        }
    }
    else
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Invalid input for UUID %s',reqId,UUID);
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

function DownloadLatestFileByID(res,FileName,option,Company,Tenant,reqId)
{

    try {

        logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Searching for Uploaded file %s',reqId,FileName);

        DbConn.FileUpload.max('Version',{where: [{Filename: FileName},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resMax) {
            if(resMax)
            {
                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Max version found for file %s',reqId,FileName);

                DbConn.FileUpload.findOne({where:[{CompanyId:Company},{TenantId:Tenant},{Filename: FileName},{Version:resMax}]}).then(function (resUpFile) {

                    if(resUpFile)
                    {

                        var UUID=resUpFile.UniqueId;
                        logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - ID found of file %s  ID : %s ',reqId,FileName,UUID);

                        if(option=="MONGO")
                        {

                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Downloading from Mongo',reqId,JSON.stringify(resUpFile));

                            var extArr=resUpFile.FileStructure.split('/');
                            var extension=extArr[1];

                            var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;

                            mongodb.MongoClient.connect(uri, function(error, db)
                            {
                                console.log(uri);
                                console.log("Error1 "+error);
                                if(error)
                                {
                                    logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Error Connecting Mongo cleint ',reqId);
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

                                    bucket.openDownloadStreamByName(UUID).
                                        pipe(res).
                                        on('error', function(error) {
                                            console.log('Error !'+error);
                                            res.status(400);
                                            db.close();
                                            res.end();
                                            //callback(error,undefined);
                                        }).
                                        on('finish', function() {
                                            console.log('done!');
                                            res.status(200);
                                            db.close();
                                            res.end();
                                            //process.exit(0);
                                        });
                                }
                                //console.log("db "+JSON.stringify(db));
                                //assert.ifError(error);


                            });



                        }
                        else if(option=="COUCH")
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
                                    var s = streamifier.createReadStream(result.value);
                                    //console.log(s);
                                    s.pipe(res);


                                    s.on('end', function (result) {
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
                                    });
                                    s.on('error', function (err) {
                                        logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                        console.log("ERROR");
                                        res.status(400);
                                        res.end();
                                    });

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
                                var SourcePath = (resUpFile.URL.toString()).replace('\',' / '');
                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',reqId,SourcePath);

                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',reqId);
                                var source = fs.createReadStream(SourcePath);

                                source.pipe(res);
                                source.on('end', function (result) {
                                    logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                    res.status(200);
                                    res.end();
                                });
                                source.on('error', function (err) {
                                    logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                    res.status(400);
                                    res.end();
                                });
                            }
                            catch(ex)
                            {
                                logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);

                                // callback(ex, undefined);
                                res.status(400);
                                res.end();
                            }
                        }
                    }
                    else
                    {
                        logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - No such file found',reqId,FileName);
                        res.status(404);
                        res.end();
                    }

                }).catch(function (errFile) {
                    logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Error in file searching',reqId,errFile);
                    res.status(400);
                    res.end();
                });
            }
            else
            {
                logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Max not found',reqId);
                res.status(404);
                res.end();
            }
        }).catch(function (errMax) {
            logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - Error in Max',reqId,errMax);
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

function SaveDownloadDetails(req,reqId,callback)
{


    try {
        var AppObject = DbConn.FileDownload
            .build(
            {
                DownloadId: req.UniqueId,
                ObjClass: req.ObjClass,
                ObjType: req.ObjType,
                ObjCategory: req.ObjCategory,
                DownloadTimestamp: Date.now(),
                Filename: req.Filename,
                CompanyId: req.CompanyId,
                TenantId: req.TenantId


            }
        )
    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while creating download details',reqId,ex);
        callback(ex, undefined);
    }

    AppObject.save().then(function (resSave) {

        logger.info('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Downloaded file details succeeded ',reqId);
        logger.info('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Downloaded file details succeeded %s',reqId,req.FileStructure);
        callback(undefined, req.FileStructure);

    }).catch(function (errSave) {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while saving download details %s',reqId,JSON.stringify(AppObject),errSave);
        callback(errSave, undefined);
    });

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




function PickAllFiles(Company,Tenant,reqId,callback)
{

    try
    {
        DbConn.FileUpload.findAll({where:[{CompanyId:Company},{TenantId:Tenant}],include:[{model:DbConn.FileCategory, as:"FileCategory"},{model:DbConn.Application, as:"Application"}]}).then(function (resFile) {


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

function PickSpecifiedFiles(fileCategory,fileFormat,Company,Tenant,reqId,callback)
{

    try
    {
        DbConn.FileUpload.findAll({where:[{CompanyId:Company},{TenantId:Tenant},{ObjCategory:fileCategory},{FileStructure:fileFormat},{ApplicationId:null}],include:[{model:DbConn.FileCategory, as:"FileCategory"},{model:DbConn.Application, as:"Application"}]}).then(function (resFile) {


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

function PickCategorySpecifiedFiles(fileCategory,fileFormat,Company,Tenant,reqId,callback)
{

    try
    {
        DbConn.FileUpload.findAll({where:[{CompanyId:Company},{TenantId:Tenant},{ObjCategory:fileCategory},{FileStructure:fileFormat}],include:[{model:DbConn.FileCategory, as:"FileCategory"}]}).then(function (resFile) {


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

function PickAllFilesWithPaging(rowCount,pageNo,Company,Tenant,reqId,callback)
{

    try
    {
        DbConn.FileUpload.findAll({
            where:[{CompanyId:Company},{TenantId:Tenant}],
            offset:((pageNo - 1) * rowCount),
            limit: rowCount,
            include:[{model:DbConn.FileCategory, as:"FileCategory"},{model:DbConn.Application, as:"Application"}],
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


                //console.log(URL);
                /* fs.unlink(URL,function(err){
                 if(err)
                 {
                 console.log(err);
                 callback(err,undefined);
                 }
                 else
                 {

                 resFile.destroy().then(function (resDel) {
                 callback(undefined,resDel);
                 }).catch(function (errDel) {
                 callback(errDel,undefined);
                 });
                 }


                 });*/

                if(option=="LOCAL")
                {
                    var URL= resFile.URL.replace(/\\/g, "/");
                    console.log("Local");
                    fs.unlink(URL,function(err){
                        if(err)
                        {
                            console.log(err);
                            callback(err,undefined);
                        }
                        else
                        {

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
                    if(option=="MONGO")
                    {
                        var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;
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
                }
            }

        });

    }
    catch(ex)
    {
        console.log("Exception");
        callback(ex,undefined);

    }





}

function  LoadCategories(reqId,callback)
{
    try
    {
        DbConn.FileCategory.findAll().then(function (resFile) {


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

function PickVoiceRecordingsOfSessionAndTypes(SessID,Class,Type,Category,Company,Tenant,reqId,callback) {
    try {
        DbConn.FileUpload.find({where: [{RefId: SessID},{ObjClass: Class},{ObjType: Type},{ObjCategory: Category},{CompanyId:Company},{TenantId:Tenant}]})
            .then(function (result) {
                if(!result)
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




function getCategoryCount(catID,catName,i,len,res)
{
    DbConn.FileUpload.count({where:['"FileCategoryId" = ?',catID]}).then(function (resCount) {

        if(resCount)
        {
            console.log("Category "+catName);
            console.log("Count "+resCount);
            CatObj.catName=resCount;
            return 1;


        }
        else
        {
            return 1;

        }

    }).catch(function (errCount) {

        return 1;
    });


}

function delIt(res)
{
    fs.unlink('C:/Users/Pawan/AppData/Local/Temp/upload_b7354b32d44feda444726b0f6a7fb8e7',function(err){
        console.log(err);
        res.end();
    })
}
function  testMax (name,comp,ten)
{
    DbConn.FileUpload.max('Version',{where: [{Filename: name},{CompanyId:comp},{TenantId:ten}],group:['UniqueId']}).then(function (r) {
        console.log(r);
    }).catch(function (e) {
        console.log(e);
    })
}



module.exports.SaveUploadFileDetails = SaveUploadFileDetails;
module.exports.downF = downF;
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
module.exports.PickVoiceRecordingsOfSessionAndTypes = PickVoiceRecordingsOfSessionAndTypes;
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
module.exports.delIt = delIt;
module.exports.testMax = testMax;
module.exports.AllFilesWithCategoryAndDateRange = AllFilesWithCategoryAndDateRange;
module.exports.FilesWithCategoryId = FilesWithCategoryId;
module.exports.FilesWithCategoryAndDateRange = FilesWithCategoryAndDateRange;
module.exports.PickAttachmentMetaDataByName = PickAttachmentMetaDataByName;








