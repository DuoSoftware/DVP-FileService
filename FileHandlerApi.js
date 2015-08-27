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
                    NewUploadObj.save().then(function (resFileSave) {

                        logger.info('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - New upload record added successfully %s',reqId,JSON.stringify(NewUploadObj));
                        callback(undefined, resFileSave.UniqueId);

                    }).catch(function (errFileSave) {
                        logger.Error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Error in saving Upload file record %s',reqId,JSON.stringify(NewUploadObj));
                        callback(errFileSave, undefined);
                    });


                    /*complete(function (errFileSave, resFileSave) {
                     if (errFileSave) {

                     logger.Error('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - Error in saving Upload file record %s',reqId,JSON.stringify(NewUploadObj));
                     callback(errFileSave, undefined);




                     }
                     else {
                     logger.info('[DVP-FIleService.UploadFile.SaveUploadFileDetails] - [%s] - [PGSQL] - New upload record added successfully %s',reqId,JSON.stringify(NewUploadObj));
                     callback(undefined, NewUploadObj.UniqueId);
                     }


                     });*/


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
    if(UUID)
    {
        try {
            DbConn.FileUpload.find({where: [{UniqueId: UUID}]}).then(function (resFile) {

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



            /*complete(function (errFile, resFile) {

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



             });*/
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

//log done...............................................................................................................
function DownloadFileByID(res,UUID,option,reqId,callback)
{
    if(UUID)
    {
        try {

            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Searching for Uploaded file %s',reqId,UUID);
            DbConn.FileUpload.find({where: [{UniqueId: UUID}]}).then(function (resUpFile) {

                if (resUpFile) {

                    if(option=="MONGO")
                    {

                        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [MONGO] - Downloading from Mongo',reqId,JSON.stringify(resUpFile));

                        var extArr=resUpFile.FileStructure.split('/');
                        var extension=extArr[1];
                        var db = new Db(MDB, new Server(MIP, MPORT));
                        db.open(function(err, db) {

                            res.setHeader('Content-Type', resUpFile.FileStructure);
                            var gridStore = new GridStore(db, UUID, "r");
                            gridStore.open(function(errOpen, gridStore) {

                                if(errOpen)
                                {
                                    callback(errOpen,undefined);
                                    res.end();
                                }
                                else
                                {
                                    var stream = gridStore.stream(true);

                                    stream.on('end',function(err) {

                                        if(err){

                                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                            callback(err,undefined);


                                        }else {

                                            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);

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




                                        }

                                        res.end();

                                        db.close();


                                    });


                                    stream.pipe(res);

                                }

                            });

                            //});
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
                    }

                }

                else {
                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - No record found for  Uploaded file  %s',reqId,UUID);
                    callback(new Error('No record for id : ' + UUID), undefined);
                    res.end();

                }

            }).catch(function (errUpFile) {

                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while searching Uploaded file  %s',reqId,UUID,errUpFile);
                callback(errUpFile, undefined);
                res.end();

            });


            /*complete(function (errUpFile, resUpFile) {

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

             });*/
        }
        catch (ex) {
            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',reqId,UUID);
            callback(new Error("No record Found for the request"), undefined);
            res.end();
        }
    }
    else
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Invalid input for UUID %s',reqId,UUID);
        callback(new Error("Invalid input for UUID"), undefined);
        res.end();
    }

}

function PickVoiceClipByName(FileName,AppID,Tid,Cid,reqId,callback)
{
    if(FileName&&AppID&&!isNaN(AppID))
    {

        var TenantId=Tid;
        var CompanyId=Cid;

        DbConn.Application.find({where:[{id:AppID}]}).then(function (resApp) {

            if(resApp)
            {
                CurrentFileVersion(Cid,Tid,AppID,FileName,reqId,function(errVersion,resVersion)
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


                            /*complete(function(err,resFile)
                             {
                             if(err)
                             {
                             logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] - [PGSQL] - Error occurred while searching for Application %s  ',reqId,AppID,err);
                             callback(err,undefined);
                             }
                             else
                             {
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

                             }
                             });*/
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

        /*complete(function(errApp,resApp)
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
         callback(errVersion,undefined);
         }
         else
         {
         if(resVersion)
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
         });*/
    }
    else
    {
        callback(new Error("Invalid inputs"),undefined);
    }







}

function CurrentFileVersion(Company,Tenant,AppID,FileName,reqId,callback)
{
    try
    {
        logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - Searching for current version  File of %s',reqId,FileName);
        //DbConn.FileUpload.find({where: [{Filename: FObj.name}]}).complete(function (err, CurFileObject)
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



        /*complete(function (err, CurFileObject)
         {
         if(err)
         {
         logger.error('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] - Error occurred while searching for current version of %s',reqId,FileName,err);
         callback(err,undefined);
         }
         else
         {
         if(CurFileObject)
         {


         logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] - Old version of %s is found and New version updated',reqId,FileName);
         callback(undefined,parseInt(CurFileObject));
         }
         else{
         logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] -  Version of % is not found and New version will be %d',reqId,FileName,1);
         callback(undefined,0);
         }

         }
         });
         */
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

function PickFileInfo(appid,reqId,callback)
{
    if(appid&&!isNaN(appid))
    {
        try
        {
            DbConn.FileUpload.find({where:[{ApplicationId:appid}]}).then(function (resFile) {

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


            /*complete(function(errFile,resFile)
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
             })*/
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

function PickFileWithAppID(UUID,appid,reqId,callback)
{

    if(UUID&&appid&&!isNaN(appid))
    {
        try
        {
            DbConn.FileUpload.find({where:[{UniqueId:UUID},{ApplicationId:appid}]}).then(function (resFile) {

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

function PickAllVoiceRecordingsOfSession(SessID,reqId,callback) {
    try {
        DbConn.FileUpload.findAll({where: [{RefId: SessID}]}).complete(function (err, result) {

            if (err) {
                callback(err, undefined);
            }
            else {
                if(result.length==0)
                {
                    callback(new Error("No records found"),undefined);
                }
                else
                {
                    callback(undefined, result);
                }

            }
        });


    }


    catch (ex) {
        callback(ex, undefined);
    }


}

function AllVoiceRecordingsOfSessionAndTypes(SessID,Class,Type,Category,st,reqId,callback) {
    try {
        DbConn.FileUpload.findAll({where: [{RefId: SessID},{ObjClass: Class},{ObjType: Type},{ObjCategory: Category}]}).complete(function (err, result) {

            if (err) {
                callback(err, undefined);
            }
            else {
                if(result.length==0)
                {
                    callback(new Error("No record found"),undefined);
                }
                else
                {
                    if(st==1)
                    {
                        callback(undefined, result);
                    }
                    else
                    {
                        callback(undefined,result[0]);
                    }

                }



            }
        });


    }


    catch (ex) {
        callback(ex, undefined);
    }


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






