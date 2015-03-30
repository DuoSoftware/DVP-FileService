var attachmate = require('attachmate');
var fstream = require('fstream');
var path = require('path');
var uuid = require('node-uuid');
var DbConn = require('./DVP-DBModels');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var mkdirp = require('mkdirp');
var couchbase = require('couchbase');
var sys=require('sys');
var express    =       require("express");
var multer     =       require('multer');
var app        =       express();
var done       =       false;
var fs=require('fs');

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


function AddToCouchBase(req,callback) {

    try {
        rand = uuid.v4().toString();
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in generating UUID ", false, null);
        callback(null, jsonString);
    }

    try {
        var r = fstream.Reader({
            path:path.resolve(__dirname, 'input')
            //type: 'Json'
        });
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in reading file ", false, null);
        callback(null, jsonString);
    }

    try {
        var w = new attachmate.Writer({
            path: 'http://192.168.1.20:8092/ScheduledObjects/newtest005',
            includeHidden: false,
            preserveExisting: true
        });
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in writing file to couch", false, null);
        callback(null, jsonString);
    }


    w.on('error', function (err) {

        console.log(err);

    });


    w.on('end', function (err) {

        console.log('Done');
        /* AddNewUploadDetails(req, function (err, res) {
         var jsonString = messageFormatter.FormatMessage(err, "PG insertion succeeded", true, res);
         res.end(jsonString);
         });*/

    });

    try {
        r.pipe(w);
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in pipe", false, null);
        callback(null, jsonString);
    }
//}

}



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


function SaveUploadFileDetails(cmp,ten,req,rand2,callback)
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
        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {

            if(err)
            {
                callback(err,undefined);
            }


            else {

                if (ScheduleObject) {
                    console.log("................................... Given Cloud End User is invalid ................................ ");
                    // var jsonString = messageFormatter.FormatMessage(err, "Record already in DB", false, null);
                    callback(undefined, undefined);
                    //res.end();
                }

                else if (!err && !ScheduleObject) {
                    // console.log(cloudEndObject);


                    var AppObject = DbConn.FileUpload
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
                            DisplayName: DisplayName,
                            CompanyId:cmp,
                            TenantId: ten


                        }
                    )

                    AppObject.save().complete(function (err, result) {
                        if (!err) {
                            var status = 1;


                            console.log("..................... Saved Successfully ....................................");
                            // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                            callback(undefined, AppObject.UniqueId);
                            // res.end();


                        }
                        else {
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

function GetAttachmentMetaDataByID(req,callback)
{
    try {
        //DbConn.FileUpload.findAll({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.FileUpload.find({where: [{UniqueId: req}]}).complete(function (err, MetaDataObject) {

            if(err)
            {
                callback(err, undefined);

            }

            else
            {
                if(MetaDataObject)
                {
                    console.log("................................... Record Found ................................ ");
                    // var jsonString = messageFormatter.FormatMessage(null, "Record Found", true, ScheduleObject);
                    callback(undefined, ScheduleObject);
                }
                else
                {
                    callback(new Error('No record found for id : '+req), undefined);
                }


            }



        });
    }
    catch (ex) {
        //console.log("Exce "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        callback(ex, undefined);
    }
}

function DownloadFileByID(res,req,callback)
{
    try {

        DbConn.FileUpload.find({where: [{UniqueId: req}]}).complete(function (err, UploadRecObject) {

            if(err)
            {
                callback(err, undefined);
            }

            else {
                res.setHeader('Content-Type', UploadRecObject.FileStructure);
                if (UploadRecObject) {
                    console.log("................................... Record Found ................................ ");

                    var s = (UploadRecObject.URL.toString()).replace('\',' / '');




                    var source = fs.createReadStream(s);

                    source.pipe(res);
                    source.on('end', function () {

                        res.end();
                    });
                    source.on('error', function (err) {

                        res.end();
                    });

                    /*
                     var AppObject = DbConn.FileDownload
                     .build(
                     {
                     UniqueId: UploadRecObject.UniqueId,
                     FileStructure: UploadRecObject.FileStructure,
                     ObjClass: UploadRecObject.ObjClass,
                     ObjType: UploadRecObject.ObjType,
                     ObjCategory: UploadRecObject.ObjCategory,
                     URL: UploadRecObject.URL,
                     DownloadTimestamp: Date.now(),
                     Filename: UploadRecObject.Filename,
                     DisplayName: UploadRecObject.DisplayName,
                     CompanyId: UploadRecObject.CompanyId,
                     TenantId: UploadRecObject.TenantId


                     }
                     )

                     AppObject.save().complete(function (err, result) {

                     if (err) {
                     console.log("..................... Error found in saving.................................... : " + err);
                     //var jsonString = messageFormatter.FormatMessage(err, "ERROR found in saving to PG", false, null);
                     callback(err, undefined);
                     //res.end();
                     }
                     else if (result) {
                     var status = 1;


                     console.log("..................... Saved Successfully ....................................");
                     // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                     callback(undefined, UploadRecObject.FileStructure);
                     // res.end();


                     }


                     });

                     */
                }

                else {
                    callback('No record for id : ' + req, undefined);
                }
            }

        });
    }
    catch (ex) {
        // console.log("Exce "+ex);
        // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        callback("No record Found for the rerquest", undefined);
    }
}


module.exports.SaveUploadFileDetails = SaveUploadFileDetails;
module.exports.downF = downF;
module.exports.GetAttachmentMetaDataByID = GetAttachmentMetaDataByID;
module.exports.DownloadFileByID = DownloadFileByID;





