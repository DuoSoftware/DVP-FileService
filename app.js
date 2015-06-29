/**
 * Created by pawan on 2/23/2015.
 */
var DbConn = require('DVP-DBModels');
var restify = require('restify');
//var sre = require('swagger-restify-express');

var FileHandler=require('./FileHandlerApi.js');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var CallServerChooser=require('./CallServerChooser.js');
var RedisPublisher=require('./RedisPublisher.js');
var DeveloperFileUpoladManager=require('./DeveloperFileUpoladManager.js');
var uuid = require('node-uuid');
var log4js=require('log4js');


var config = require('config');

var port = config.Host.port || 3000;

var version=config.Host.version;
var hpath=config.Host.hostpath;
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;

log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("app");


var RestServer = restify.createServer({
    name: "myapp",
    version: '1.0.0'
},function(req,res)
{

});
//Server listen
RestServer.listen(port, function () {
    console.log('%s listening at %s', RestServer.name, RestServer.url);

});
//Enable request body parsing(access)
RestServer.use(restify.bodyParser());
RestServer.use(restify.acceptParser(RestServer.acceptable));
RestServer.use(restify.queryParser());






//RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/UploadFile/:cmp/:ten/:prov',function(req,res,next)

RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/UploadFileWithProvision/:prov/ToCompany/:CmpID/Of/:TenID',function(req,res,next)
{
// instance 1,
    // profile 2,
    //shared 3

    var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }
        logger.debug('[DVP-FIleService.UploadFile] - [%s] - [HTTP] - Request received  - Inputs - Provision : %s Company : %s Tenant : %s',reqId,req.params.prov,req.params.CmpID,req.params.TenID);

        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        logger.info('[DVP-FIleService.UploadFile] - [%s] - [FS] - File path - %s',reqId,file.path);

        var DisplyArr = file.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];

        var ValObj={

            "tenent":req.params.TenID,
            "company":req.params.CmpID,
            "filename":file.name,
            "type":file.type,
            "id":rand2
        };

        var AttchVal=JSON.stringify(ValObj);

        logger.info('[DVP-FIleService.UploadFile] - [%s] - [FS] - Attachment values - %s',reqId,AttchVal);

        var ProvTyp=req.params.prov;

        if(ProvTyp==1) {
            try {
                CallServerChooser.InstanceTypeCallserverChooser(req.params.CmpID, req.params.ten,reqId,function (errIns, resIns) {

                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - [FS] - Instance type is selected - %s',reqId,ProvTyp);
                    if (resIns) {


                        logger.info('[DVP-FIleService.UploadFile] - [%s] - Uploaded File details Saving starts - File - %s',reqId,JSON.stringify(file));
                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2,reqId,function (errFileSave, resFileSave) {
                            if (resFileSave) {



                                RedisPublisher.RedisPublish(resIns, AttchVal,reqId,function (errRDS, resRDS) {
                                        if (errRDS) {
                                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                                            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);


                                        }
                                        else {
                                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
                                            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);


                                        }


                                    }
                                );


                            }

                            else
                            {
                                if (errFileSave) {


                                    var jsonString = messageFormatter.FormatMessage(errFileSave, "ERROR/EXCEPTION", false, undefined);
                                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                    res.end(jsonString);
                                }

                            }
                        });

                    }
                    else if (errIns) {

                        var jsonString = messageFormatter.FormatMessage(errIns, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

                });


            }
            catch (ex) {
                logger.error('[DVP-FIleService.UploadFile] - [%s] - Exception occurred when entering to CallServerChooser method',reqId,ex);
                var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }


        }

        else if(ProvTyp==2)
        {
            try {
                logger.debug('[DVP-FIleService.UploadFile] - [FILEHANDLER] - Profile type is selected - '+ProvTyp);
                CallServerChooser.ProfileTypeCallserverChooser(req.params.cmp, req.params.ten,reqId, function (errProf, resProf) {
                    if (resProf) {


                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2,reqId, function (errFileSave, resFileSave) {
                            if (resFileSave) {

                                RedisPublisher.RedisPublish(resProf, AttchVal,reqId, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                                            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);

                                        }
                                        else {
                                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
                                            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);

                                        }

                                    }
                                );

                            }

                            else
                            {
                                if (errFileSave) {
                                    var jsonString = messageFormatter.FormatMessage(errFileSave, "ERROR/EXCEPTION", false, undefined);
                                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                    res.end(jsonString);

                                }


                            }

                        });

                    }
                    else if (errProf) {
                        var jsonString = messageFormatter.FormatMessage(errProf, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

                });


            }
            catch (ex) {
                logger.error('[DVP-FIleService.UploadFile] - [%s] - [FS] - Exception occurred when Profiletype actions starts',reqId,ex);
                var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
                res.end(jsonString);
            }
        }




        else
        {
            try {
                logger.debug('[DVP-FIleServic.UploadFile] - [FILEHANDLER] - Shared type is selected - '+ProvTyp);
                CallServerChooser.SharedTypeCallsereverChooser(req.params.cmp, req.params.ten,reqId, function (errShared, resShared) {

                    if (resShared) {


                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2,reqId, function (errFileSave, respg) {
                            if (respg) {

                                logger.debug('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] -[REDIS] - Redis publishing details  - ServerID :  ' + JSON.stringify(resShared) + ' Attachment values : ' + AttchVal);
                                RedisPublisher.SharedServerRedisUpdate(resShared, AttchVal,reqId);
                                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, respg);
                                logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);


                            }

                            else
                            {
                                if (errFileSave)
                                {
                                    var jsonString = messageFormatter.FormatMessage(errFileSave, "ERROR/EXCEPTION", false, undefined);
                                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                    res.end(jsonString);
                                }


                            }
                        });

                    }
                    else if (errShared) {
                        var jsonString = messageFormatter.FormatMessage(errShared, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

                });


            }
            catch (ex) {
                logger.error('[DVP-FIleService.UploadFile] - [%s] [FILEHANDLER] - Exception occurred when entering to CallServerChooser method ',reqId,ex);
                var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        }

    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.UploadFile] - [%s] - [FILEHANDLER] - Exception occurred when calling upload function ',reqId,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});

//.......................................................................................................................

/*
 RestServer.post('/DVP/API/:version/FIleService/FileHandler/Download_file_remote',function(req,res,next)
 {


 try {

 FileHandler.downF();
 res.end();

 }
 catch(ex)
 {

 var jsonString = messageFormatter.FormatMessage(ex, "Upload not succeeded:exception found", false, null);
 res.end(jsonString);
 }
 return next();
 });


 */
/*
 RestServer.post('/DVP/API/:version/FIleService/FileHandler/ProfileTypeCallserverChooser',function(req,res,next)
 {
 try {
 CallServerChooser.ProfileTypeCallserverChooser(req,function(err,resz)
 {
 if(err==null)
 {

 res.end(resz);
 }


 });



 }
 catch(ex)
 {
 var jsonString = messageFormatter.FormatMessage(ex, "GetMaxLimit failed", false, res);
 res.end(jsonString);
 }

 return next();

 });
 */

//RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/DevUploadFile/:cmp/:ten/:prov',function(req,res,next)
RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/DeveloperFileUpload/:cmp/:ten/:prov',function(req,res,next)
{
    var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }
        
        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,req.params.prov,req.params.cmp,req.params.ten);
        
        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [FILEUPLOAD] - File path %s ',reqId,file.path);

        var DisplyArr = file.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];

        var ValObj={

            "tenent":req.params.ten,
            "company":req.params.cmp,
            "filename":file.name,
            "type":file.type,
            "id":rand2
        };

        var AttchVal=JSON.stringify(ValObj);

        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s',reqId,AttchVal);

        var ProvTyp=req.params.prov;

        if(ProvTyp==1) {
            try {
                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [FILEUPLOAD] - Instance type is selected');
                CallServerChooser.InstanceTypeCallserverChooser(req.params.cmp, req.params.ten,reqId, function (errIns, resIns) {


                    if (resIns) {


                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Uploaded File details Saving starts - File - %s',reqId,JSON.stringify(file));
                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten,1,reqId,function (errz, respg) {
                            if (respg) {


                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resIns),AttchVal);
                                RedisPublisher.RedisPublish(resIns, AttchVal,reqId, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                                            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);



                                        }
                                        else {
                                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
                                            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);




                                        }


                                    }
                                );


                            }

                            else if (errz) {

                                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);
                            }

                        });

                    }
                    else if (errIns) {

                        var jsonString = messageFormatter.FormatMessage(errIns, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

                });


            }
            catch (ex) {
                logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Error occurred whe provision type : 1 action starts  ',reqId);
                var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }


        }

        else if(ProvTyp==2)
        {
            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [FILEUPLOAD] - Profile type is selected');
            try {
                CallServerChooser.ProfileTypeCallserverChooser(req.params.cmp, req.params.ten,reqId, function (errProf, resProf) {

                    if (resProf) {

                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Uploaded File details saving starts - File - %s',reqId,JSON.stringify(file));
                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten,1,reqId,function (errUpload, resUpload) {
                            if (resUpload) {

                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resProf),AttchVal);
                                RedisPublisher.RedisPublish(resProf, AttchVal, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                                            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);

                                        }
                                        else {
                                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
                                            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);

                                        }

                                    }
                                );


                            }

                            else if (errUpload) {
                                var jsonString = messageFormatter.FormatMessage(errUpload, "ERROR/EXCEPTION", false, undefined);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);

                            }

                        });

                    }
                    else if (errProf) {
                        var jsonString = messageFormatter.FormatMessage(errProf, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

                });


            }
            catch (ex) {
                logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Error occurred whe provision type : 2 action starts  ',reqId);
                var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        }




        else
        {
            try {
                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [FILEUPLOAD] - Shared type is selected');
                CallServerChooser.SharedTypeCallsereverChooser(req.params.cmp, req.params.ten,reqId, function (errShared, resShared) {

                    if (resShared) {

                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Uploaded File details saving starts - File - %s',reqId,JSON.stringify(file));
                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten,1,reqId, function (errUpload, resUpload) {
                            if (resUpload) {

                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resShared),AttchVal);
                                RedisPublisher.SharedServerRedisUpdate(resShared,AttchVal);
                                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resUpload);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);



                            }

                            else if (errUpload) {
                                var jsonString = messageFormatter.FormatMessage(errUpload, "ERROR/EXCEPTION", false, undefined);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);
                            }

                        });

                    }
                    else if (errShared) {
                        var jsonString = messageFormatter.FormatMessage(errShared, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

                });


            }
            catch (ex) {
                logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Error occurred when Shared type : 2 action starts  ',reqId);
                var jsonString = messageFormatter.FormatMessage(ex, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        }

    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [HTTP] - Exception occurred when Developer file upload request starts  ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});

RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/File/:uuid/AssignToApp/:AppId',function(req,res,next)
{

    DeveloperFileUpoladManager.FileAssignWithApplication(req.params.uuid,parseInt(req.params.AppId),function(errMap,resMap)
    {
        if(errMap)
        {
            console.log(errMap);
        }else{
            console.log(resMap);
        }

        res.end();
    });
    next();
});

RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/ClipsOfApplication/:AppID/OfCompany/:CompanyId/AndTenant/:TenantId',function(req,res,next)
{
    var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }
        // log.info("\n.............................................File Uploding Starts....................................................\n");
        //log.info("Upload params  :- ComapnyId : "+req.params.cmp+" TenentId : "+req.params.ten+" Provision : "+req.params.prov);

        logger.debug('[DVP-FIleService.GetVoiceAppClipsByName] - [%s] - [HTTP] - Request received - Inputs - File name : %s , AppName : %s , Tenant : %s , Company : %s',reqId,req.params.Filename,req.params.AppName,req.params.TenantId,req.params.CompanyId);
        FileHandler.GetVoiceClipIdbyName(req.params.AppID,req.params.TenantId,req.params.CompanyId,reqId,function (err, resz) {
            if (err) {
                //console.log(err);
                //
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.GetVoiceAppClipsByName] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else {
               // console.log(resz);
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.GetVoiceAppClipsByName] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        });

    }


    catch(ex) {
        logger.error('[DVP-FIleService.GetVoiceAppClipsByName] - [%s] - [HTTP] - Exception found starting activity GetVoiceAppClipsByName  - Inputs - File name : %s , AppName : %s , Tenant : %s , Company : %s',reqId,req.params.AppID,req.params.TenantId,req.params.CompanyId,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.GetVoiceAppClipsByName] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});




RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/DownloadFile/:id',function(req,res,next)
{
    var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        FileHandler.DownloadFileByID(res,req.params.id,reqId,function(errDownFile,resDownFile)
        {
            if(errDownFile)
            {
                var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else if(resDownFile)
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", false, resDownFile);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }

        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.end(jsonString);
    }

    return next();

});


//RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/GetAttachmentMetaData/:id',function(req,res,next)
RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/AttachmentMetaData/:UUID',function(req,res,next)
{
    var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.UUID);


        FileHandler.GetAttachmentMetaDataByID(req.params.UUID,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else if(resz)
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - [HTTP] - Exception occurred when starting AttachmentMetaData service - Inputs - File ID : %s ',reqId,req.params.UUID);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});


RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/FileInfoForApplicationId/:appId',function(req,res,next)
{
    var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.GetFileId] - [%s] - [HTTP] - Request received - Inputs - APP ID : %s ',reqId,req.params.appId);


        FileHandler.GetFileId(parseInt(req.params.appId),reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.GetFileId] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else if(resz)
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.GetFileId] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.GetFileId] - [%s] - [HTTP] - Exception occurred when starting AttachmentMetaData service - Inputs - File ID : %s ',reqId,req.params.appId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.GetFileId] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.post('/DVP',function(req,res,next)
{



    //RedisPublisher.RedisGet();

});


/*
 RestServer.get('/testit',function(req,res,next)
 {
 try {


 RedisPublisher.TestIt();




 }
 catch(ex)
 {
 var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, res);
 res.end(jsonString);
 }

 return next();

 });

 */