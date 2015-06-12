/**
 * Created by pawan on 2/23/2015.
 */

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


///DVP/API/:version/TrunkApi/AddNumber/:id

//.......................................post............................................................................



/*
 RestServer.post('/DVP/API/:version/FIleService/FileHandler/UploadFile',function(req,res,next)
 {


 try {
 FileHandler.AddToCouchBase(req.body,function(err,res)
 {
 var jsonString = messageFormatter.FormatMessage(ex, "Upload succeeded", true, res);
 res.end(jsonString);
 });



 }
 catch(ex)
 {
 var jsonString = messageFormatter.FormatMessage(ex, "Upload failed", false, res);
 res.end(jsonString);
 }
 return next();
 });
 */

//callback Done..........................................................................................................
//Log Done...............................................................................................................
//RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/UploadFile/:cmp/:ten/:prov',function(req,res,next)

RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/UploadFileWithProvision/:prov/ToCompany/:cmp/Of/:ten',function(req,res,next)
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
        // log.info("\n.............................................File Uploding Starts....................................................\n");
        // log.info("Upload params  :- ComapnyId : "+req.params.cmp+" TenentId : "+req.params.ten+" Provision : "+req.params.prov);
        logger.debug('[DVP-FIleService.UploadFile] - [%s] - [HTTP] - Request received  - Inputs - Provision : %s Company : %s Tenant : %s',reqId,req.params.prov,req.params.cmp,req.params.ten);

        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        //console.log(file.path);
        //log.info("File path : "+file.path);
        logger.info('[DVP-FIleService.UploadFile] - [%s] - [FS] - File path - %s',reqId,file.path);

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
        //console.log(AttchVal);

        //log.info("Attachment Values : "+AttchVal);
        logger.info('[DVP-FIleService.UploadFile] - [%s] - [FS] - Attachment values - %s',reqId,AttchVal);

        var ProvTyp=req.params.prov;



        if(ProvTyp==1) {
            try {
                CallServerChooser.InstanceTypeCallserverChooser(req.params.cmp, req.params.ten,reqId,function (err, resz) {

                    //log.info("Instance type is selected : "+ProvTyp);
                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - [FS] - Instance type is selected - %s',reqId,ProvTyp);
                    if (resz) {


                        logger.info('[DVP-FIleService.UploadFile] - [%s] - Uploaded File details Saving starts - File - %s',reqId,JSON.stringify(file));
                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2,reqId,function (errz, respg) {
                            if (respg) {


                                //log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                //logger.debug('[DVP-FIleService.FileHandler.UploadFile] - [FS] -[PGSQL] - Redis publishing details  - ServerID :  ' + JSON.stringify(resz) + ' Attachment values : ' + AttchVal);

                                RedisPublisher.RedisPublish(resz, AttchVal,reqId,function (errRDS, resRDS) {
                                        if (errRDS) {
                                            // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                            //log.error("Error occurred in publishing to redis   : "+errRDS);
                                            //logger.error('[DVP-FIleService.FileHandler.UploadFile] - [%s] - [REDIS] - Error in Redis publishing - ServerID :  ' + JSON.stringify(resz) + ' Attachment values : ' + AttchVal + ' - Error - ' + errRDS);
                                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                                            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);


                                        }
                                        else {
                                            //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                            //log.info("Successfully published to redis "+resRDS);
                                            //logger.debug('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] - Redis publishing succeeded  - Response - ' + resRDS);
                                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
                                            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);


                                        }


                                    }
                                );


                            }

                            else
                            {
                                if (errz) {

                                    //log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                    //logger.error('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] - Error occurred in saving uploaded file details to Database - Company :  ' + req.params.cmp + ' tenant : ' + req.params.ten + 'File Details : ' + JSON.stringify(file) + ' UUID : ' + rand2 + ' - Error - ' + errz);

                                    var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                    res.end(jsonString);
                                }

                            }
                            //respg.end();
                        });

                    }
                    else if (err) {

                        //log.error("Error occurred in searching suitable call server   : "+err);
                       // logger.error('[DVP-FIleService.UploadFile] - [%s] - [FILEHANDLER] - Error occurred in searching suitable call server - Inputs - Company : '+req.params.cmp+' Tenant : '+req.params.ten+' Provision : Instance');
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                //log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                logger.error('[DVP-FIleService.UploadFile] - [%s] - Exception occurred when entering to CallServerChooser method',reqId,ex);
                var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }


        }

        else if(ProvTyp==2)
        {
            try {
                //log.info("Profile type is selected : "+ProvTyp);
                logger.debug('[DVP-FIleService.UploadFile] - [FILEHANDLER] - Profile type is selected - '+ProvTyp);
                CallServerChooser.ProfileTypeCallserverChooser(req.params.cmp, req.params.ten,reqId, function (err, resz) {
                    if (resz) {


                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2,reqId, function (errz, respg) {
                            if (respg) {

                                //log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                               // logger.debug('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] -[REDIS] - Redis publishing details  - ServerID :  ' + JSON.stringify(resz) + ' Attachment values : ' + AttchVal);
                                RedisPublisher.RedisPublish(resz, AttchVal,reqId, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            //log.error("Error occurred in publishing to redis   : "+errRDS);
                                            // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                            //logger.error('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] - Error in Redis publishing - ServerID :  ' + JSON.stringify(resz) + ' Attachment values : ' + AttchVal + ' - Error - ' + errRDS);
                                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                                            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);

                                        }
                                        else {
                                            //log.info("Successfully published to redis "+resRDS);
                                            //logger.debug('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] - Redis publishing succeeded  - Response - ' + resRDS);
                                            //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
                                            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);

                                        }

                                    }
                                );


                            }

                            else
                            {
                                if (errz) {
                                    //log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                    //logger.error('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] - Error occurred in saving uploaded file details to Database - Company :  ' + req.params.cmp + ' tenant : ' + req.params.ten + 'File Details : ' + JSON.stringify(file) + ' UUID : ' + rand2 + ' - Error - ' + errz);
                                    var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                    res.end(jsonString);

                                }


                            }

                            //respg.end();
                        });

                    }
                    else if (err) {
                        //log.error("Error occurred in searching suitable call server   : "+err);
                        //logger.error('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] - Error occurred in searching suitable call server - Inputs - Company : '+req.params.cmp+' Tenant : '+req.params.ten+' Provision : Profile');
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                //log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                logger.error('[DVP-FIleService.UploadFile] - [%s] - [FS] - Exception occurred when Profiletype actions starts',reqId,ex);
                var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
                res.end(jsonString);
            }
        }




        else
        {
            try {
                //log.info("Shared type is selected : "+ProvTyp);
                logger.debug('[DVP-FIleServic.UploadFile] - [FILEHANDLER] - Shared type is selected - '+ProvTyp);
                CallServerChooser.SharedTypeCallsereverChooser(req.params.cmp, req.params.ten,reqId, function (err, resz) {

                    if (resz) {


                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2,reqId, function (errz, respg) {
                            if (respg) {

                                //log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                logger.debug('[DVP-FIleService.FileHandler.UploadFile] - [FILEHANDLER] -[REDIS] - Redis publishing details  - ServerID :  ' + JSON.stringify(resz) + ' Attachment values : ' + AttchVal);
                                RedisPublisher.SharedServerRedisUpdate(resz, AttchVal,reqId);
                                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, respg);
                                logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);


                            }

                            else
                            {
                                if (errz)
                                {
                                    //log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                    //logger.error('[DVP-FIleService.UploadFile] - [FILEHANDLER] - Error occurred in saving uploaded file details to Database - Company :  ' + req.params.cmp + ' tenant : ' + req.params.ten + 'File Details : ' + JSON.stringify(file) + ' UUID : ' + rand2 + ' - Error - ' + errz);
                                    var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                                    res.end(jsonString);
                                }


                            }
                            //respg.end();
                        });

                    }
                    else if (err) {
                        //log.error("Error occurred in searching suitable call server   : "+err);
                        //logger.error('[DVP-FIleService.UploadFile] - [FILEHANDLER] - Error occurred in searching suitable call server - Inputs - Company : '+req.params.cmp+' Tenant : '+req.params.ten+' Provision : Shared');
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                //log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                logger.error('[DVP-FIleService.UploadFile] - [%s] [FILEHANDLER] - Exception occurred when entering to CallServerChooser method ',reqId,ex);
                var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        }

    }
    catch(ex)
    {
        //log.fatal("Exception occurred when calling upload function   : "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Upload failed", false, res);
        // res.end(jsonString);
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
        // log.info("\n.............................................File Uploding Starts....................................................\n");
        //log.info("Upload params  :- ComapnyId : "+req.params.cmp+" TenentId : "+req.params.ten+" Provision : "+req.params.prov);
        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,req.params.prov,req.params.cmp,req.params.ten);
        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        //console.log(file.path);
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
        //console.log(AttchVal);

        //log.info("Attachment Values : "+AttchVal);
        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s',reqId,AttchVal);

        var ProvTyp=req.params.prov;



        if(ProvTyp==1) {
            try {
                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [FILEUPLOAD] - Instance type is selected');
                CallServerChooser.InstanceTypeCallserverChooser(req.params.cmp, req.params.ten,reqId, function (err, resz) {


                    if (resz) {


                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Uploaded File details Saving starts - File - %s',reqId,JSON.stringify(file));
                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten,1,reqId,function (errz, respg) {
                            if (respg) {


                                //log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resz),AttchVal);
                                RedisPublisher.RedisPublish(resz, AttchVal,reqId, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                           // log.error("Error occurred in publishing to redis   : "+errRDS);
                                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                                            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);



                                        }
                                        else {
                                            //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                            //log.info("Successfully published to redis "+resRDS);
                                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
                                            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);




                                        }


                                    }
                                );

                               // res.end();

                            }

                            else if (errz) {

                                //log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);
                            }

                            //respg.end();
                        });

                    }
                    else if (err) {

                        //log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                //log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
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
                //log.info("Profile type is selected : "+ProvTyp);
                CallServerChooser.ProfileTypeCallserverChooser(req.params.cmp, req.params.ten,reqId, function (err, resz) {

                    if (resz) {

                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Uploaded File details saving starts - File - %s',reqId,JSON.stringify(file));
                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten,1,reqId,function (errz, respg) {
                            if (respg) {

                                //log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resz),AttchVal);
                                RedisPublisher.RedisPublish(resz, AttchVal, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            //log.error("Error occurred in publishing to redis   : "+errRDS);
                                            // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                                            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);

                                        }
                                        else {
                                           // log.info("Successfully published to redis "+resRDS);
                                            //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
                                            logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                            res.end(jsonString);

                                        }

                                    }
                                );


                            }

                            else if (errz) {
                                //log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);

                            }

                            //respg.end();
                        });

                    }
                    else if (err) {
                       // log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

//resz.end();
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
                CallServerChooser.SharedTypeCallsereverChooser(req.params.cmp, req.params.ten,reqId, function (err, resz) {

                    if (resz) {

                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Uploaded File details saving starts - File - %s',reqId,JSON.stringify(file));
                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten,1,reqId, function (errz, respg) {
                            if (respg) {

                                //log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resz),AttchVal);
                                RedisPublisher.SharedServerRedisUpdate(resz,AttchVal);
                                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, respg);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);



                            }

                            else if (errz) {
                                //log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                                logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                                res.end(jsonString);
                            }

                            //respg.end();
                        });

                    }
                    else if (err) {
                        //log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

//resz.end();
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
        //log.fatal("Exception occurred when calling upload function   : "+ex);
        logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [HTTP] - Exception occurred when Developer file upload request starts  ',reqId);
        //var jsonString = messageFormatter.FormatMessage(ex, "Upload failed", false, res);
        // res.end(jsonString);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});

// chk urls in swagger #below
// look up
RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/FileAssignToApp',function(req,res,next)
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
        logger.debug('[DVP-FIleService.FileAssignToApp] - [%s] - [HTTP] - Request received - Inputs - %s',reqId,JSON.stringify(req.body));

        DeveloperFileUpoladManager.UploadAssignToApplication(req.body,reqId,function(err,resz)
        {
            if(err)
            {
               // console.log(err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                //console.log(resz);
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        });



    }
    catch(ex) {
        logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s]  - [HTTP] - Exception occurred when request starts  ',reqId,JSON.stringify(req.body));
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});
//check body
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




//callback done.......................................get.............................................................................
//Log Done...............................................................................................................
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
        // log.info("\n.............................................File Uploding Starts....................................................\n");
        //log.info("Upload params  :- ComapnyId : "+req.params.cmp+" TenentId : "+req.params.ten+" Provision : "+req.params.prov);

        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        //log.info("File ID : "+req.params.id);
        FileHandler.DownloadFileByID(res,req.params.id,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else if(resz)
            {
                // var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                //res.end();
                //log.info("Successfully Downloaded.Result : "+resz);
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", false, resz);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }

        });



    }
    catch(ex)
    {
        //log.fatal("Exception found  in downloading : "+ex);
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.end(jsonString);
    }

    return next();

});

//callback done.
//Log Done...............................................................................................................
//RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/GetAttachmentMetaData/:id',function(req,res,next)
RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/AttachmentMetaData/:id',function(req,res,next)
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

        logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);


        FileHandler.GetAttachmentMetaDataByID(req.params.id,reqId,function(err,resz)
        {
            if(err)
            {
               // log.error("error found  in searching : "+err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else if(resz)
            {
                //log.info("Successfully Downloaded.Result : "+resz);
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - [HTTP] - Exception occurred when starting AttachmentMetaData service - Inputs - File ID : %s ',reqId,req.params.id);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.AttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP',function(req,res,next)
{



    RedisPublisher.RedisGet();

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