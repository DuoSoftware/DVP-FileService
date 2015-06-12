//var attachmate = require('attachmate');
var fstream = require('fstream');
var path = require('path');
var uuid = require('node-uuid');
var DbConn = require('DVP-DBModels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
//var couchbase = require('couchbase');
var sys=require('sys');
var express    =       require("express");
var multer     =       require('multer');
var app        =       express();
var done       =       false;
var fs=require('fs');
var log4js=require('log4js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;


var config = require('config');

var hpath=config.Host.hostpath;


log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("fhandler");


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






/*
 function AddNewUploadDetails(req, callback) {
 try {
 var obj = req.body;
 }
 catch (ex) {
 var jsonString = messageFormatter.FormatMessage(ex, "Exception in generating converting request to object ", false, null);
 callback(null, jsonString);
 }
 try {
 var rand = "number:" + uuid.v4().toString();
 }
 catch (ex) {
 var jsonString = messageFormatter.FormatMessage(ex, "Exception in generating UUID ", false, null);
 callback(null, jsonString);
 }

 try {
 DbConn.FileUpload.findAll({where: [{UniqueId: rand}]}).complete(function (err, ScheduleObject) {
 if (!err && ScheduleObject.length == 0) {
 // console.log(cloudEndObject);


 var AppObject = DbConn.FileUpload
 .build(
 {
 UniqueId: rand,
 FileStructure: obj.FileStructure,
 ObjClass: obj.ObjClass,
 ObjType: obj.ObjType,
 ObjCategory: obj.ObjCategory,
 URL: obj.URL,
 UploadTimestamp: Date.now(),
 Filename: obj.Filename,
 DisplayName: obj.DisplayName,
 CompanyId: obj.CompanyId,
 TenantId: obj.TenantId


 }
 )

 AppObject.save().complete(function (err, result) {
 if (!err) {
 var status = 1;


 console.log("..................... Saved Successfully ....................................");
 var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
 callback(null, jsonString);


 }
 else {
 console.log("..................... Error found in saving.................................... : " + err);
 var jsonString = messageFormatter.FormatMessage(err, "ERROR found in saving to PG", false, null);
 callback(null, jsonString);
 }


 });


 }
 else if (ScheduleObject) {
 console.log("................................... Given Cloud End User is invalid ................................ ");
 var jsonString = messageFormatter.FormatMessage(err, "Record already in DB", false, null);
 callback(null, jsonString);
 }
 else {
 var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
 callback(null, jsonString);
 }


 });
 }
 catch (ex) {
 var jsonString = messageFormatter.FormatMessage(ex, "exception", false, null);
 callback(null, jsonString);

 }
 }
 */


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
    //log.info('\n.............................................SaveUploadFileDetails Starts....................................................\n');

    try {
        //log.info('Inputs :- CompanyID :'+cmp+" TenentID : "+ten+" File : "+req+" UUID : "+rand2);
        var DisplyArr = req.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];
    }
    catch(ex)
    {
        //log.fatal('Exception in DisplyName splitting : '+ex);
        callback(ex,undefined);
    }



    try {
        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, CurFileObject) {


            if(err)
            {
                //log.error('Error in Searching upload record : '+rand2);
                logger.error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Error occurred while searching for Uploaded file record ',reqId,err);
                callback(err,undefined);

            }


            else {

                if (CurFileObject) {
                    //console.log("................................... Given Cloud End User is invalid ................................ ");
                    // var jsonString = messageFormatter.FormatMessage(err, "Record already in DB", false, null);
                    //log.error('Already in DB : '+rand2);
                    logger.error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - File is already uploaded %s',reqId,JSON.stringify(CurFileObject));
                    callback("Already in DB", undefined);
                    //res.end();
                }

                else {
                    // console.log(cloudEndObject);

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
                    //log.info('New Uploading record  : '+NewUploadObj);
                    NewUploadObj.save().complete(function (err, result) {
                        if (!err) {
                            var status = 1;

                            // log.info('Successfully saved '+NewUploadObj.UniqueId);
                            //console.log("..................... Saved Successfully ....................................");
                            // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                            logger.info('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - New upload record added successfully %s',reqId,JSON.stringify(NewUploadObj));
                            callback(undefined, NewUploadObj.UniqueId);
                            // res.end();


                        }
                        else {
                            logger.Error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Error in saving Upload file record %s',reqId,JSON.stringify(NewUploadObj));
                            //console.log("..................... Error found in saving.................................... : " + err);
                            //var jsonString = messageFormatter.FormatMessage(err, "ERROR found in saving to PG", false, null);
                            callback(err, undefined);
                            //res.end();
                        }


                    });


                }


            }


        });
    }
    catch (ex) {
        //log.fatal("Exception found : "+ex);
        logger.Error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Exception occurred while calling File upload search ',reqId,ex);
        callback(ex, undefined);
    }


}

function downF()
{
    var source = fs.createReadStream('C:/Users/pawan/AppData/Local/Temp/upload_2ac9da85f25059f246bc075205f9bd58');
    var dest = fs.createWriteStream('C:/Users/pawan/Desktop/jsons/apss');

    source.pipe(dest);
    source.on('end', function() { /* copied */ });
    source.on('error', function(err) { /* error */ });
}
//log done...............................................................................................................
function GetAttachmentMetaDataByID(req,reqId,callback)
{
    //log.info('\n.............................................GetAttachmentMetaDataByID Starts....................................................\n');
    try {
        //log.info("Inputs :- UniqueID : "+req);
        //DbConn.FileUpload.findAll({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.FileUpload.find({where: [{UniqueId: req}]}).complete(function (err, MetaDataObject) {

            if(err)
            {
                logger.error('[DVP-FIleService.AttachmentMetaData] - [%s] - [PGSQL] - Error occurred while searching for Uploaded file Metadata %s  ',reqId,req);
                callback(err, undefined);

            }

            else
            {
                if(MetaDataObject)
                {
                    //log.info("Record found : "+JSON.stringify(MetaDataObject));
                    logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - [PGSQL] - Uploaded file %s  metadata found ',reqId,req);
                    //console.log("................................... Record Found ................................ ");
                    // var jsonString = messageFormatter.FormatMessage(null, "Record Found", true, ScheduleObject);
                    callback(undefined, MetaDataObject);
                }
                else
                {
                    logger.error('[DVP-FIleService.AttachmentMetaData] - [%s] - [PGSQL] - Uploaded file %s metadata not found ',reqId,req);
                    callback(new Error('No record found for id : '+req), undefined);
                }


            }



        });
    }
    catch (ex) {
        //console.log("Exce "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        logger.error('[DVP-FIleService.AttachmentMetaData] - [%s] - Exception occurred when starting GetAttachmentMetaDataByID %s ',reqId,req);
        callback(ex, undefined);
    }
}

//log done...............................................................................................................
function DownloadFileByID(res,req,reqId,callback)
{
    try {
        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Searching for Uploaded file %s',reqId,req);
        DbConn.FileUpload.find({where: [{UniqueId: req}]}).complete(function (err, UploadRecObject) {

            if(err)
            {
                //log.error("Error in searching for record : "+req+" Error : "+err);
                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while searching Uploaded file  %s',reqId,req,err);
                callback(err, undefined);
            }

            else {

                if (UploadRecObject) {

                    logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Record found for File upload %s',reqId,JSON.stringify(UploadRecObject));
                    //console.log("................................... Record Found ................................ ");
                    try {
                        res.setHeader('Content-Type', UploadRecObject.FileStructure);
                        var SourcePath = (UploadRecObject.URL.toString()).replace('\',' / '');
                        logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',reqId,SourcePath);

                        logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',reqId);
                        var source = fs.createReadStream(SourcePath);

                        source.pipe(res);
                        source.on('end', function (result) {
                            //log.info("Pipe succeeded  : "+result);
                            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                            res.end();
                        });
                        source.on('error', function (err) {
                            //log.error("Error in pipe : "+err);
                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                            res.end('Error on pipe');
                        });
                    }
                    catch(ex)
                    {
                        //log.fatal("Exception found : "+ex);
                        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);

                        callback(ex, undefined);
                    }

                    try {
                        var AppObject = DbConn.FileDownload
                            .build(
                            {
                                DownloadId: UploadRecObject.UniqueId,
                                ObjClass: UploadRecObject.ObjClass,
                                ObjType: UploadRecObject.ObjType,
                                ObjCategory: UploadRecObject.ObjCategory,
                                DownloadTimestamp: Date.now(),
                                Filename: UploadRecObject.Filename,
                                CompanyId: UploadRecObject.CompanyId,
                                TenantId: UploadRecObject.TenantId


                            }
                        )
                    }
                    catch(ex)
                    {
                        //log.fatal("Exception found in creating FileDownload record object : "+ex);
                        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while creating download details',reqId,ex);
                        callback(err, undefined);
                    }

                    AppObject.save().complete(function (err, result) {

                        if (err) {
                            //console.log("..................... Error found in saving.................................... : " + err);
                            //var jsonString = messageFormatter.FormatMessage(err, "ERROR found in saving to PG", false, null);
                            //log.error("Error in saving : "+err);
                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while saving download details %s',reqId,JSON.stringify(AppObject),err);
                            callback(err, undefined);
                            //res.end();
                        }
                        else if (result) {
                            var status = 1;


                            //console.log("..................... Saved Successfully ....................................");
                            // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                            //log.info("Successfully saved : "+result);
                            logger.info('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Downloaded file details succeeded ',reqId);
                            logger.info('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Downloaded file details succeeded %s',reqId,UploadRecObject.FileStructure);
                            callback(undefined, UploadRecObject.FileStructure);
                            // res.end();


                        }


                    });


                }

                else {
                    //log.error("No record found: "+req);
                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - No record found for  Uploaded file  %s',reqId,req);
                    callback('No record for id : ' + req, undefined);

                }
            }

        });
    }
    catch (ex) {
        // console.log("Exce "+ex);
        // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',reqId,req);
        callback("No record Found for the rerquest", undefined);
    }
}

function GetVoiceClipIdByName(AppId,Tid,Cid,reqId,callback)
{

    var AppID=AppId;
    var TenantId=Tid;
    var CompanyId=Cid;

    DbConn.Application.find({where:[{id:AppID}]}).complete(function(errApp,resApp)
    {
        if(errApp)
        {
            logger.error('[DVP-FIleService.GetVoiceAppClipsByName] - [%s] - [PGSQL] - Error occurred while searching for Application %s  ',reqId,AppID,errApp);
            callback("No application found",undefined);
        }
        else
        {
            //DbConn.FileUpload.find({where:[{Filename: FileName},{TenantId: TenantId},{CompanyId: CompanyId},{ApplicationId:resApp.id}]}).complete(function(err,resFile)
            DbConn.FileUpload.find({where:[{TenantId: TenantId},{CompanyId: CompanyId},{ApplicationId:resApp.id}]}).complete(function(err,resFile)
            {
                if(err)
                {
                    logger.error('[DVP-FIleService.GetVoiceAppClipsByName] - [%s] - [PGSQL] - Error occurred while searching for Application %s  ',reqId,AppID,err);
                    callback(err,undefined);
                }
                else
                {
                    logger.info('[DVP-FIleService.GetVoiceAppClipsByName] - [%s] - [PGSQL] - Record found for Application %s  result - %s',reqId,AppID,resFile);
                    callback(undefined,resFile.UniqueId);
                }
            });
        }
    });






}

function GetFileId(appid,filename,callback)
{
    try
    {
        DbConn.FileUpload.find({where:[{ApplicationId:appid},{Filename:filename}]}).complete(function(errFile,resFile)
        {
            if(errFile)
            {
                callback(errFile,undefined);
            }
            else
            {
                if(resFile==null)
                {
                    callback(new Error("No file"),undefined);
                }
                else
                {
                    callback(undefined,resFile);
                }
            }
        })
    }
    catch(ex)
    {
        callback(ex,undefined);
    }
}

module.exports.SaveUploadFileDetails = SaveUploadFileDetails;
module.exports.downF = downF;
module.exports.GetAttachmentMetaDataByID = GetAttachmentMetaDataByID;
module.exports.DownloadFileByID = DownloadFileByID;
module.exports.GetVoiceClipIdbyName = GetVoiceClipIdByName;
module.exports.GetFileId = GetFileId;





