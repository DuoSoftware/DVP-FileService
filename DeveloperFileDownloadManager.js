/**
 * Created by pawan on 4/15/2015.
 */

var DbConn = require('dvp-dbmodels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var fs=require('fs');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;



function DeveloperVoiceRecordingDownload(req,callback) {
    try {
        DbConn.FileUpload.find({where: [{UniqueId: req},{ObjType: 'Voice Recording'}]}).complete(function (err, UploadRecObject) {

            if (err) {
                callback(err, undefined);
            }

            else {

                if (UploadRecObject) {

                    log.info("Recode found : " + JSON.stringify(UploadRecObject));
                    console.log("................................... Record Found ................................ ");
                    try {
                        res.setHeader('Content-Type', UploadRecObject.FileStructure);
                        var SourcePath = (UploadRecObject.URL.toString()).replace('\',' / '');

                        var source = fs.createReadStream(SourcePath);

                        source.pipe(res);
                        source.on('end', function (result) {
                            //log.info("Pipe succeeded  : "+result);
                            res.end();
                        });
                        source.on('error', function (err) {
                            //log.error("Error in pipe : "+err);
                            res.end('Error on pipe');
                        });
                    }
                    catch (ex) {
                        // log.fatal("Exception found : "+ex);

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
                    catch (ex) {
                        //log.fatal("Exception found in creating FileDownload record object : "+ex);
                        callback(err, undefined);
                    }
                    AppObject.save().complete(function (err, result) {

                        if (err) {
                            console.log("..................... Error found in saving.................................... : " + err);
                            //var jsonString = messageFormatter.FormatMessage(err, "ERROR found in saving to PG", false, null);
                            // log.error("Error in saving : "+err);
                            callback(err, undefined);
                            //res.end();
                        }
                        else if (result) {
                            var status = 1;


                            console.log("..................... Saved Successfully ....................................");
                            // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                            // log.info("Successfully saved : "+result);
                          //  callback(undefined, UploadRecObject.FileStructure);


                            try
                            {
                                DbConn.FileUpload.update(
                                {
                                Status:'Downloaded'
                                },
                                    {UniqueId:req,ObjType:'Voice Recording'}
                                      ).then(function (result) {
                                        status = 1;
                                        //console.log("Extension updated successfully");
                                        //logger.info(' Updated Successfully');
                                       // var jsonString = messageFormatter.FormatMessage(null, "Availability changed successfully", true, result);
                                        callback(undefined, result);

                                    }).error(function (err) {
                                        //console.log("Extension update false ->");
                                        //logger.info('Error found in Updating : ' + result);
                                        //var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                                        callback("Error Found",undefined);

                                    });
                            }
                            catch(ex)
                            {
                                callback(ex,undefined);
                            }

                            // res.end();


                        }


                    });


                }

                else {
                    // log.error("No record found: "+req);
                    callback('No record for id : ' + req, undefined);

                }
            }

        });
    }
    catch (ex) {
        // console.log("Exce "+ex);
        // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        //log.fatal("Exception found : "+ex);
        callback("No record Found for the rerquest", undefined);
    }

}
function DeveloperVoiceAppClipsDownload(req,callback) {
    try {
        //log.info('\n.............................................GetAttachmentMetaDataByID Starts....................................................\n');
        console.log('Hit');
        DbConn.FileUpload.find({where: [{UniqueId: req},{ObjType: 'Voice app clip'}]}).complete(function (err, UploadRecObject) {

            if (err) {
                //log.error("Error in searching for record : "+req+" Error : "+err);
                callback(err, undefined);
            }

            else {

                if (UploadRecObject) {

                    log.info("Recode found : " + JSON.stringify(UploadRecObject));
                    console.log("................................... Record Found ................................ ");
                    try {
                        res.setHeader('Content-Type', UploadRecObject.FileStructure);
                        var SourcePath = (UploadRecObject.URL.toString()).replace('\',' / '');

                        var source = fs.createReadStream(SourcePath);

                        source.pipe(res);
                        source.on('end', function (result) {
                            //log.info("Pipe succeeded  : "+result);
                            res.end();
                        });
                        source.on('error', function (err) {
                            //log.error("Error in pipe : "+err);
                            res.end('Error on pipe');
                        });
                    }
                    catch (ex) {
                        // log.fatal("Exception found : "+ex);

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
                    catch (ex) {
                        //log.fatal("Exception found in creating FileDownload record object : "+ex);
                        callback(err, undefined);
                    }
                    AppObject.save().complete(function (err, result) {

                        if (err) {
                            console.log("..................... Error found in saving.................................... : " + err);
                            //var jsonString = messageFormatter.FormatMessage(err, "ERROR found in saving to PG", false, null);
                            // log.error("Error in saving : "+err);
                            callback(err, undefined);
                            //res.end();
                        }
                        else if (result) {
                            var status = 1;


                            console.log("..................... Saved Successfully ....................................");
                            // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                            // log.info("Successfully saved : "+result);
                            //  callback(undefined, UploadRecObject.FileStructure);


                            try
                            {
                                DbConn.FileUpload.update(
                                    {
                                        Status:'Downloaded'
                                    },
                                    {UniqueId:req,ObjType:'Voice app clip'}
                                ).then(function (result) {
                                        status = 1;
                                        //console.log("Extension updated successfully");
                                        //logger.info(' Updated Successfully');
                                        // var jsonString = messageFormatter.FormatMessage(null, "Availability changed successfully", true, result);
                                        callback(undefined, result);

                                    }).error(function (err) {
                                        //console.log("Extension update false ->");
                                        //logger.info('Error found in Updating : ' + result);
                                        //var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                                        callback("Error Found",undefined);

                                    });
                            }
                            catch(ex)
                            {
                                callback(ex,undefined);
                            }

                            // res.end();


                        }


                    });


                }

                else {
                    // log.error("No record found: "+req);
                    callback('No record for id : ' + req, undefined);

                }
            }

        });
    }
    catch (ex) {
        // console.log("Exce "+ex);
        // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        //log.fatal("Exception found : "+ex);
        callback("No record Found for the rerquest", undefined);
    }

}


module.exports.DeveloperVoiceRecordingDownload = DeveloperVoiceRecordingDownload;
module.exports.DeveloperVoiceAppClipsDownload = DeveloperVoiceAppClipsDownload;
