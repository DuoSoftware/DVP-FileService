/**
 * Created by Pawan on 7/8/2016.
 */

var path = require('path');
var uuid = require('node-uuid');
var DbConn = require('dvp-dbmodels');
var config = require('config');
var streamifier = require('streamifier');
var fs=require('fs');
var gm = require('gm').subClass({imageMagick: true});
var async= require('async');
var util = require('util');

const crypto = require('crypto');
var crptoAlgo = config.Crypto.algo;
var crptoPwd = config.Crypto.password;
var DeveloperFileUpoladManager=require('./DeveloperFileUpoladManager.js');
var uploadPath="/usr/local/src/upload";




//Sprint 5

//var couchbase = require('couchbase');
var Cbucket=config.Couch.bucket;
var CHip=config.Couch.ip;

//var cluster = new couchbase.Cluster("couchbase://"+CHip);
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var RedisPublisher=require('./RedisPublisher.js');

var mongodb= require('mongodb');
var mongoip = config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodbase=config.Mongo.dbname;
var mongopass=config.Mongo.password;
var mongouser=config.Mongo.user;
var mongoreplicaset=config.Mongo.replicaset;


var path= require('path');
var mkdirp = require('mkdirp');

var DeveloperFileUpoladManager=require('./DeveloperFileUpoladManager.js');


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

function FindCurrentVersion(FObj,company,tenant,reqId,callback)
{
    try
    {
        logger.debug('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - Searching for current version of %s',reqId,FObj.name);
        DbConn.FileUpload.max('Version',{where: [{Filename: FObj.name},{CompanyId:company},{TenantId:tenant}]}).then(function (resFile) {

            if(resFile)
            {
                logger.debug('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - [PGSQL] - Old version of % is found and New version will be %d',reqId,FObj.name,parseInt((resFile)+1));
                callback(undefined,parseInt((resFile)+1));
            }
            else
            {
                logger.debug('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - [PGSQL] -  Version of %s is not found and New version will be 1',reqId,FObj.name);
                callback(undefined,1);
            }

        }).catch(function (errFile) {

            logger.error('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - [PGSQL] - Error occurred while searching for current version of %s',reqId,FObj.name,errFile);
            callback(errFile,undefined);

        });

    }
    catch (ex)
    {
        logger.error('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - Exception occurred when start searching current version of %s',reqId,FObj.name,ex);
        callback(ex,undefined);
    }
};

function localTubmnailDownloader(res,dataObj) {
    logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Record found for File upload %s',dataObj.reqId,dataObj.UUID);
    try {

        res.setHeader('Content-Type', dataObj.FileStructure);
        var file_category=dataObj.ObjCategory;
        //var SourcePath = (resUpFile.URL.toString()).replace('\',' / '');

        var SourcePath = path.join(uploadPath,"Company_"+dataObj.Company.toString()+"_Tenant_"+dataObj.Tenant.toString(),file_category+"_thumb",dataObj.year.toString()+"-"+dataObj.month.toString()+"-"+dataObj.date.toString(),(dataObj.UUID+"_"+dataObj.thumbSize).toString());

        /*var SourcePath=path.parse(resUpFile.URL.toString()).root;
         pathObj.forEach(function (value,index) {
         if(index==(pathObj.length-5))
         {
         value=value+"_thumb"
         }
         if(index==pathObj.length-1)
         {
         value=value+"_"+thumbSize;
         }

         SourcePath=path.join(SourcePath,value.toString());
         });
         //var SourcePath = (SourcePath.toString()).replace('\',' / '');*/
        console.log(SourcePath);

        logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',dataObj.reqId,SourcePath);

        logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',dataObj.reqId);


        var source = fs.createReadStream(SourcePath.toString());

        source.pipe(res);
        source.on('end', function (result) {
            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',dataObj.reqId);
            res.status(200);
            res.end();
        });
        source.on('error', function (err) {
            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',dataObj.reqId,err);
            res.status(400);
            res.end();
        });
    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',dataObj.reqId,ex);
        res.status(400);
        res.end();
    }
}

function MongoThumbnailDownloader(res,UUID,thumbSize,reqId) {

    logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [MONGO] - Downloading from Mongo : File - %s',reqId,UUID);


    try {



        mongodb.MongoClient.connect(uri, function (error, db) {
            console.log(uri);

            if (error) {
                console.log("Mongo connection error " + error);
                res.status(400);
                if(db)
                {
                    db.close();
                }

                res.end();
            }
            else {
                var ThumbBucket = new mongodb.GridFSBucket(db, {
                    chunkSizeBytes: 1024,
                    bucketName: 'thumbnails'
                });
                /*  easyimg.thumbnail({
                 src:bucket.openDownloadStreamByName(UUID), dst:res,
                 width:128, height:128,
                 x:0, y:0
                 }).then(function (image) {
                 console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
                 res.status(200);
                 db.close();
                 res.end();

                 },function (err) {
                 console.log(err);
                 res.status(400);
                 db.close();
                 res.end();
                 });*/
                // var thumbName=UUID + "_"+thumbSize+"X"+thumbSize;



                var thumbName=UUID+"_"+thumbSize.toString();
                console.log(thumbName);

                console.log("Piping Started");

                ThumbBucket.openDownloadStreamByName(thumbName).
                pipe(res).
                on(
                    'error',
                    function(error) {
                        console.log('Error in piping !'+error);
                        res.status(400);
                        db.close();
                        res.end();

                    }).
                on('finish', function () {
                    console.log('done! Piping Succeeded');
                    res.status(200);
                    db.close();
                    res.end();

                });
            }
        });
    } catch (e)
    {
        console.log('Exception '+e);
        res.status(400);
        db.close();
        res.end();
    }

}

function DownloadThumbnailByID(res,fileObj)
{
    if(fileObj.UUID)
    {
        try {

            var Today= new Date();
            var date= Today.getDate();
            if(date<10)
            {
                date="0"+date;
            }
            var month=Today.getMonth()+1;
            if(month<10)
            {
                month="0"+month;
            }
            var year =Today.getFullYear();


            logger.debug('[DVP-FIleService.InternalFileService.DownloadThumbnailByID] - [%s] - Searching for Uploaded file %s',fileObj.reqId,fileObj.UUID);
            DbConn.FileUpload.find({where: [{UniqueId: fileObj.UUID},{CompanyId:fileObj.Company},{TenantId:fileObj.Tenant}]}).then(function (resUpFile) {

                if (resUpFile) {


                    fileObj.FileStructure=resUpFile.FileStructure;
                    fileObj.URL=resUpFile.URL;
                    fileObj.date=date;
                    fileObj.month=month;
                    fileObj.year=year;
                    fileObj.ObjCategory=resUpFile.ObjCategory;


                    var fileStore="LOCAL";

                    if(resUpFile.Source)
                    {
                        fileStore=resUpFile.Source;
                    }
                    else
                    {
                        fileStore=fileObj.option.toUpperCase();
                    }

                    if(fileStore=="MONGO")
                    {
                        MongoThumbnailDownloader(res,fileObj.UUID,fileObj.thumbSize,fileObj.reqId);
                    }
                    else
                    {
                        localTubmnailDownloader(res,fileObj);
                    }



                }

                else {
                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - No record found for  Uploaded file  %s',fileObj.reqId,fileObj.UUID);
                    res.status(404);
                    res.end();

                }

            }).catch(function (errUpFile) {

                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while searching Uploaded file  %s',fileObj.reqId,fileObj.UUID,errUpFile);
                res.status(400);
                res.end();

            });



        }
        catch (ex) {
            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',fileObj.reqId,fileObj.UUID);
            res.status(400);
            res.end();
        }
    }
    else
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Invalid input for UUID %s',fileObj.reqId,fileObj.UUID);
        res.status(404);
        res.end();
    }

};

function FileInfoByID(res,UUID,Company,Tenant,reqId)
{
    logger.debug('[DVP-FIleService.InternalFileService.FileInfoByID] - [%s] - Searching for Uploaded file %s',reqId,UUID);
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
                logger.debug('[DVP-FIleService.InternalFileService.FileInfoByID] - [%s] - No such file found for ID %s',reqId,UUID);
                res.status(404);
                res.end();
            }
        }).catch(function (errFile) {
            logger.error('[DVP-FIleService.InternalFileService.FileInfoByID] - [%s] - Error in searching records for ID  %s',reqId,UUID,errFile);
            res.status(400);
            res.end();
        });
    }
    else
    {
        logger.error('[DVP-FIleService.InternalFileService.FileInfoByID] - [%s] - Invalid ID  %s',reqId,UUID);
        res.status(404);
        res.end();
    }

};


function LatestFileInfoByID(res,FileName,Company,Tenant,reqId)
{
    try {

        logger.debug('[DVP-FIleService.InternalFileService.LatestFileInfoByID] - [%s] - Searching for Uploaded file %s',reqId,FileName);

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
                logger.error('[DVP-FIleService.InternalFileService.LatestFileInfoByID] - [%s] - File not found FileName %s',reqId,FileName);
                res.status(404);
                res.end();
            }
        }).catch(function (errMax) {
            logger.error('[DVP-FIleService.InternalFileService.LatestFileInfoByID] - [%s] - Error in searching Latest File , FileName %s',reqId,FileName,errMax);
            res.status(400);
            res.end();
        });



    }
    catch (ex) {
        logger.error('[DVP-FIleService.InternalFileService.LatestFileInfoByID] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service %s ',reqId,FileName);
        res.status(400);
        res.end();
    }
};





module.exports.FileInfoByID = FileInfoByID;
module.exports.LatestFileInfoByID = LatestFileInfoByID;
module.exports.DownloadThumbnailByID = DownloadThumbnailByID;

