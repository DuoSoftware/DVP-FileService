var attachmate = require('attachmate');
var fstream = require('fstream');
var path = require('path');
var uuid = require('node-uuid');
var DbConn = require('DVP-DBModels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var mkdirp = require('mkdirp');
//var couchbase = require('couchbase');
var sys=require('sys');
var express    =       require("express");
var multer     =       require('multer');
var app        =       express();
var done       =       false;
var fs=require('fs');
var log4js=require('log4js');


var config = require('config');

var hpath=config.Host.hostpath;


log4js.configure(hpath+'/config/log4js_config.json', { cwd: './logs' });
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

    mkdirp(outputPath, function(err) {
        if (err) return;

        attachmate.download(
            'http://192.168.1.20:8092/ScheduledObjects/newtest005',
            outputPath,
            function(err) {
                console.log('done, error = ', err);
            }
        );
    });




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
function SaveUploadFileDetails(cmp,ten,req,rand2,callback)
{
    log.info('\n.............................................SaveUploadFileDetails Starts....................................................\n');

    try {
        log.info('Inputs :- CompanyID :'+cmp+" TenentID : "+ten+" File : "+req+" UUID : "+rand2);
        var DisplyArr = req.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];
    }
    catch(ex)
    {
        log.fatal('Exception in DisplyName splitting : '+ex);
        callback(ex,undefined);
    }



    try {
        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, CurFileObject) {

            if(err)
            {
                log.error('Error in Searching upload record : '+rand2);
                callback(err,undefined);

            }


            else {

                if (CurFileObject) {
                    console.log("................................... Given Cloud End User is invalid ................................ ");
                    // var jsonString = messageFormatter.FormatMessage(err, "Record already in DB", false, null);
                    log.error('Already in DB : '+rand2);
                    callback(undefined, undefined);
                    //res.end();
                }

                else {
                    // console.log(cloudEndObject);


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
                            Filename: req.name,
                            Version:req.Version,
                            DisplayName: DisplayName,
                            CompanyId:cmp,
                            TenantId: ten


                        }
                    )
                    log.info('New Uploading record  : '+NewUploadObj);
                    NewUploadObj.save().complete(function (err, result) {
                        if (!err) {
                            var status = 1;

                            log.info('Successfully saved '+NewUploadObj.UniqueId);
                            console.log("..................... Saved Successfully ....................................");
                            // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                            callback(undefined, NewUploadObj.UniqueId);
                            // res.end();


                        }
                        else {
                            log.error("Error in saving "+err);
                            console.log("..................... Error found in saving.................................... : " + err);
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
        log.fatal("Exception found : "+ex);
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
function GetAttachmentMetaDataByID(req,callback)
{
    log.info('\n.............................................GetAttachmentMetaDataByID Starts....................................................\n');
    try {
        log.info("Inputs :- UniqueID : "+req);
        //DbConn.FileUpload.findAll({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.FileUpload.find({where: [{UniqueId: req}]}).complete(function (err, MetaDataObject) {

            if(err)
            {
                log.error("Error in searching "+req+" Error: "+err);
                callback(err, undefined);

            }

            else
            {
                if(MetaDataObject)
                {
                    log.info("Record found : "+JSON.stringify(MetaDataObject));
                    console.log("................................... Record Found ................................ ");
                    // var jsonString = messageFormatter.FormatMessage(null, "Record Found", true, ScheduleObject);
                    callback(undefined, MetaDataObject);
                }
                else
                {log.error("No record found ");
                    callback(new Error('No record found for id : '+req), undefined);
                }


            }



        });
    }
    catch (ex) {
        //console.log("Exce "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        log.fatal("Exception found: "+ex);
        callback(ex, undefined);
    }
}

//log done...............................................................................................................
function DownloadFileByID(res,req,callback)
{
    try {
        log.info('\n.............................................GetAttachmentMetaDataByID Starts....................................................\n');
        console.log('Hit');
        DbConn.FileUpload.find({where: [{UniqueId: req}]}).complete(function (err, UploadRecObject) {

            if(err)
            {
                log.error("Error in searching for record : "+req+" Error : "+err);
                callback(err, undefined);
            }

            else {

                if (UploadRecObject) {

                    log.info("Recode found : "+JSON.stringify(UploadRecObject));
                    console.log("................................... Record Found ................................ ");
                    try {
                        res.setHeader('Content-Type', UploadRecObject.FileStructure);
                        var SourcePath = (UploadRecObject.URL.toString()).replace('\',' / '');

                        var source = fs.createReadStream(SourcePath);

                        source.pipe(res);
                        source.on('end', function (result) {
                            log.info("Pipe succeeded  : "+result);
                            res.end();
                        });
                        source.on('error', function (err) {
                            log.error("Error in pipe : "+err);
                            res.end('Error on pipe');
                        });
                    }
                    catch(ex)
                    {
                        log.fatal("Exception found : "+ex);

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
                        log.fatal("Exception found in creating FileDownload record object : "+ex);
                        callback(err, undefined);
                    }
                    AppObject.save().complete(function (err, result) {

                        if (err) {
                            console.log("..................... Error found in saving.................................... : " + err);
                            //var jsonString = messageFormatter.FormatMessage(err, "ERROR found in saving to PG", false, null);
                            log.error("Error in saving : "+err);
                            callback(err, undefined);
                            //res.end();
                        }
                        else if (result) {
                            var status = 1;


                            console.log("..................... Saved Successfully ....................................");
                            // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                            log.info("Successfully saved : "+result);
                            callback(undefined, UploadRecObject.FileStructure);
                            // res.end();


                        }


                    });


                }

                else {
                    log.error("No record found: "+req);
                    callback('No record for id : ' + req, undefined);

                }
            }

        });
    }
    catch (ex) {
        // console.log("Exce "+ex);
        // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        log.fatal("Exception found : "+ex);
        callback("No record Found for the rerquest", undefined);
    }
}

function GetVoiceClipIdByName(Flnm,AppNm,Tid,Cid,callback)
{
var FileName=Flnm;
    var AppName=AppNm;
    var TenantId=Tid;
    var CompanyId=Cid;

    DbConn.Application.find({where:[{AppName:AppName}]}).complete(function(errApp,resApp)
    {
        if(errApp)
        {
            callback("No application found");
        }
        else
        {
            DbConn.FileUpload.find({where:[{Filename: FileName},{TenantId: TenantId},{CompanyId: CompanyId},{ApplicationId:resApp.id}]}).complete(function(err,resFile)
            {
                if(err)
                {
                    callback(err,undefined);
                }
                else
                {
                    callback(undefined,resFile.UniqueId);
                }
            });
        }
    });






}


module.exports.SaveUploadFileDetails = SaveUploadFileDetails;
module.exports.downF = downF;
module.exports.GetAttachmentMetaDataByID = GetAttachmentMetaDataByID;
module.exports.DownloadFileByID = DownloadFileByID;
module.exports.GetVoiceClipIdbyName = GetVoiceClipIdByName;





