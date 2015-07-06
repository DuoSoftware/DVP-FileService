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

    try {
        var DisplyArr = req.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];
    }
    catch(ex)
    {
        callback(ex,undefined);
    }



    try {
        DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (errFile, resFile) {


            if(errFile)
            {
                logger.error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Error occurred while searching for Uploaded file record ',reqId,errFile);
                callback(errFile,undefined);

            }


            else {

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
                    NewUploadObj.save().complete(function (errFileSave, resFileSave) {
                        if (errFileSave) {

                            logger.Error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Error in saving Upload file record %s',reqId,JSON.stringify(NewUploadObj));
                            callback(errFileSave, undefined);




                        }
                        else {
                            logger.info('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - New upload record added successfully %s',reqId,JSON.stringify(NewUploadObj));
                            callback(undefined, NewUploadObj.UniqueId);
                        }


                    });


                }


            }


        });
    }
    catch (ex) {
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
function PickAttachmentMetaData(UUID,reqId,callback)
{
    try {
        DbConn.FileUpload.find({where: [{UniqueId: UUID}]}).complete(function (errFile, resFile) {

            if(errFile)
            {
                logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - [PGSQL] - Error occurred while searching for Uploaded file Metadata %s  ',reqId,UUID);
                callback(errFile, undefined);

            }

            else
            {
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


            }



        });
    }
    catch (ex) {
        logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Exception occurred when starting PickAttachmentMetaData %s ',reqId,UUID);
        callback(ex, undefined);
    }
}

//log done...............................................................................................................
function DownloadFileByID(res,UUID,reqId,callback)
{
    try {
        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Searching for Uploaded file %s',reqId,UUID);
        DbConn.FileUpload.find({where: [{UniqueId: UUID}]}).complete(function (errUpFile, resUpFile) {

            if(errUpFile)
            {
                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while searching Uploaded file  %s',reqId,UUID,errUpFile);
                callback(errUpFile, undefined);
            }

            else {

                if (resUpFile) {

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
                            res.end();
                        });
                        source.on('error', function (err) {
                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                            res.end('Error on pipe');
                        });
                    }
                    catch(ex)
                    {
                        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);

                        callback(ex, undefined);
                    }

                    try {
                        var AppObject = DbConn.FileDownload
                            .build(
                            {
                                DownloadId: resUpFile.UniqueId,
                                ObjClass: resUpFile.ObjClass,
                                ObjType: resUpFile.ObjType,
                                ObjCategory: resUpFile.ObjCategory,
                                DownloadTimestamp: Date.now(),
                                Filename: resUpFile.Filename,
                                CompanyId: resUpFile.CompanyId,
                                TenantId: resUpFile.TenantId


                            }
                        )
                    }
                    catch(ex)
                    {
                        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while creating download details',reqId,ex);
                        callback(errUpFile, undefined);
                    }

                    AppObject.save().complete(function (err, result) {

                        if (err) {
                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while saving download details %s',reqId,JSON.stringify(AppObject),err);
                            callback(err, undefined);
                        }
                        else if (result) {


                            logger.info('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Downloaded file details succeeded ',reqId);
                            logger.info('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Downloaded file details succeeded %s',reqId,resUpFile.FileStructure);
                            callback(undefined, resUpFile.FileStructure);


                        }


                    });


                }

                else {
                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - No record found for  Uploaded file  %s',reqId,UUID);
                    callback('No record for id : ' + UUID, undefined);

                }
            }

        });
    }
    catch (ex) {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',reqId,UUID);
        callback("No record Found for the rerquest", undefined);
    }
}

function PickVoiceClipByName(FileName,AppId,Tid,Cid,reqId,callback)
{

    var AppID=AppId;
    var TenantId=Tid;
    var CompanyId=Cid;

    DbConn.Application.find({where:[{id:AppID}]}).complete(function(errApp,resApp)
    {
        if(errApp)
        {
            logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] - [PGSQL] - Error occurred while searching for Application %s  ',reqId,AppID,errApp);
            callback(new Error("No application found"),undefined);
        }
        else
        {
            if(resApp)
            {
                CurrentFileVersion(Cid,Tid,AppID,FileName,reqId,function(errVersion,resVersion)
                {
                    if(errVersion)
                    {

                    }else
                    {
                        if(resVersion!=0)
                        {
                            DbConn.FileUpload.find({where:[{TenantId: TenantId},{CompanyId: CompanyId},{ApplicationId:resApp.id},{Version:resVersion},{Filename:FileName}]}).complete(function(err,resFile)
                            {
                                if(err)
                                {
                                    logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] - [PGSQL] - Error occurred while searching for Application %s  ',reqId,AppID,err);
                                    callback(err,undefined);
                                }
                                else
                                {
                                    logger.info('[DVP-FIleService.PickVoiceClipByName] - [%s] - [PGSQL] - Record found for Application %s  result - %s',reqId,AppID,resFile);
                                    callback(undefined,resFile.UniqueId);
                                }
                            });
                        }
                        else
                        {
                            callback(new Error("No such version"),undefined);
                        }
                    }
                })
            }
            else
            {
                callback(new Error("No Such Application"),undefined);
            }



        }
    });






}

function CurrentFileVersion(Company,Tenant,AppID,FileName,reqId,callback)
{
    try
    {
        logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - Searching for current version of %s',reqId,FObj.name);
        //DbConn.FileUpload.find({where: [{Filename: FObj.name}]}).complete(function (err, CurFileObject)
        DbConn.FileUpload.max('Version',{where: [{Filename: FileName},{CompanyId:Company},{TenantId:Tenant},{ApplicationId:AppID}]}).complete(function (err, CurFileObject)
        {
            if(err)
            {
                logger.error('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] - Error occurred while searching for current version of %s',reqId,FObj.name,err);
                callback(err,undefined);
            }
            else
            {
                if(CurFileObject)
                {
                    logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] - Old version of % is found and New version will be %d',reqId,FObj.name,parseInt((CurFileObject)+1));
                    callback(undefined,parseInt(CurFileObject));
                }
                else{
                    logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] -  Version of % is not found and New version will be %d',reqId,FObj.name,1);
                    callback(undefined,0);
                }

            }
        });
    }
    catch (ex)
    {
        logger.error('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - Exception occurred when start searching current version of %s',reqId,FObj.name,ex);
        callback(ex,undefined);
    }
}



function PickFileInfo(appid,reqId,callback)
{
    try
    {
        DbConn.FileUpload.find({where:[{ApplicationId:appid}]}).complete(function(errFile,resFile)
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

function PickFileWithAppID(UUID,appid,reqId,callback)
{
    try
    {
        DbConn.FileUpload.find({where:[{UniqueId:UUID},{ApplicationId:appid}]}).complete(function(errFile,resFile)
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
module.exports.PickAttachmentMetaData = PickAttachmentMetaData;
module.exports.DownloadFileByID = DownloadFileByID;
module.exports.PickVoiceClipByName = PickVoiceClipByName;
module.exports.PickFileInfo = PickFileInfo;
module.exports.PickFileWithAppID = PickFileWithAppID;





