/**
 * Created by pawan on 2/23/2015.
 */
var DbConn = require('dvp-dbmodels');
var restify = require('restify');
//var sre = require('swagger-restify-express');

var FileHandler=require('./FileHandlerApi.js');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var CallServerChooser=require('./CallServerChooser.js');
var RedisPublisher=require('./RedisPublisher.js');
var DeveloperFileUpoladManager=require('./DeveloperFileUpoladManager.js');
var uuid = require('node-uuid');
//var jwt = require('restify-jwt');
//var secret = require('dvp-common/Authentication/Secret.js');


// Security
//var jwt = require('restify-jwt');
//var secret = require('dvp-common/Authentication/Secret.js');
var jwt = require('restify-jwt');
var secret = require('dvp-common/Authentication/Secret.js');
var authorization = require('dvp-common/Authentication/Authorization.js');
//...............................................

var config = require('config');

var port = config.Host.port || 3000;

var version=config.Host.version;
var hpath=config.Host.hostpath;
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;


var option = config.Option;

restify.CORS.ALLOW_HEADERS.push('authorization');

restify.CORS.ALLOW_HEADERS.push('Access-Control-Request-Method');






var RestServer = restify.createServer({
    name: "myapp",
    version: '1.0.0'
},function(req,res)
{

});


RestServer.use(restify.CORS());
RestServer.use(restify.fullResponse());
RestServer.pre(restify.pre.userAgentConnection());
//RestServer.use(jwt({secret: secret.Secret}));


restify.CORS.ALLOW_HEADERS.push('authorization');


//Server listen
RestServer.listen(port, function () {
    console.log('%s listening at %s', RestServer.name, RestServer.url);
    //DeveloperFileUpoladManager.CouchUploader('123456','C:/Users/Pawan/Downloads/Raja_Perahera_Meda.mp3');
    //DeveloperFileUpoladManager.Reader();
    // FileHandler.downF()


});
//Enable request body parsing(access)
RestServer.use(restify.bodyParser());
RestServer.use(restify.acceptParser(RestServer.acceptable));
RestServer.use(restify.queryParser());
RestServer.use(jwt({secret: secret.Secret}));







RestServer.post('/DVP/API/'+version+'/FileService/UploadFileWithProvision/:prov',authorization({resource:"fileservice", action:"write"}),function(req,res,next)
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


    if(!req.user.company || !req.user.tenant)
    {
        var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
        logger.debug('[DVP-APPRegistry.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    var Company=req.user.company;
    var Tenant=req.user.tenant;


        logger.debug('[DVP-FIleService.UploadFile] - [%s] - [HTTP] - Request received  - Inputs - Provision : %s Company : %s Tenant : %s',reqId,req.params.prov,Company,Tenant);

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
                CallServerChooser.InstanceTypeCallserverChooser(Company, Tenant,reqId,function (errIns, resIns) {

                    logger.debug('[DVP-FIleService.UploadFile] - [%s] - [FS] - Instance type is selected - %s',reqId,ProvTyp);
                    if (resIns) {


                        logger.info('[DVP-FIleService.UploadFile] - [%s] - Uploaded File details Saving starts - File - %s',reqId,JSON.stringify(file));
                        FileHandler.SaveUploadFileDetails(Company, Tenant, file, rand2,reqId,function (errFileSave, resFileSave) {
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
                CallServerChooser.ProfileTypeCallserverChooser(Company, Tenant,reqId, function (errProf, resProf) {
                    if (resProf) {


                        FileHandler.SaveUploadFileDetails(Company, Tenant, file, rand2,reqId, function (errFileSave, resFileSave) {
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
                CallServerChooser.SharedTypeCallsereverChooser(Company, Tenant,reqId, function (errShared, resShared) {

                    if (resShared) {


                        FileHandler.SaveUploadFileDetails(Company, Tenant, file, rand2,reqId, function (errFileSave, respg) {
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



RestServer.post('/DVP/API/'+version+'/FileService/File/Upload',authorization({resource:"fileservice", action:"write"}),function(req,res,next)
{
    var reqId='';
    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    if(!req.user.company || !req.user.tenant)
    {
        var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
        logger.debug('[DVP-APPRegistry.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    var Company=req.user.company;
    var Tenant=req.user.tenant;

    /*var Company=1;
    var Tenant=1;*/




    var prov=1;

    var Clz='';
    var Type='';
    var Category=req.body.fileCategory;

    if(req.body.class)
    {

        Clz=req.body.class;

      //  Clz="tempClz";

    }
    if(req.body.category)
    {

        Type=req.body.category;

        //Category="tempType";

    }
    if(req.body.type)
    {

        Category=req.body.type;
    }


    var ref=req.body.referenceid;

    var ref="tempRef";

    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }


        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,prov,Company,Tenant);

        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        logger.info('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - File path %s ',reqId,file.path);

        var DisplyArr = file.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];


        var ValObj={

            "tenent":Tenant,
            "company":Company,
            "filename":file.name,
            "type":file.type,
            "id":rand2

        };

        var AttchVal=JSON.stringify(ValObj);


        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s',reqId,AttchVal);

        var ProvTyp=prov;

        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,Company, Tenant,ref,option,Clz,Type,Category,reqId,function (errz, respg) {


            if(errz)
            {
                console.log("up failed");
                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            //  if (respg)
            else{

                console.log("up save");
                logger.debug('[DVP-FIleService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(respg),AttchVal);
                RedisPublisher.RedisPublish(respg, AttchVal,reqId, function (errRDS, resRDS) {
                        if (errRDS) {

                            console.log("read error");
                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                            logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                            res.end(jsonString);



                        }
                        else {
                            console.log(AttchVal.id);
                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, rand2);
                            logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                            res.end(jsonString);




                        }


                    }
                );


            }



        });

        /*if(ProvTyp==1) {
         try {
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - Instance type is selected');
         CallServerChooser.InstanceTypeCallserverChooser(Company, Tenant,reqId, function (errIns, resIns) {


         if (resIns) {
         console.log("server choose");

         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Uploaded File details Saving starts - File - %s',reqId,JSON.stringify(file));
         DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,Company, Tenant,ref,option,Clz,Type,Category,reqId,function (errz, respg) {


         if(errz)
         {
         console.log("up failed");
         var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);
         }
         //  if (respg)
         else{

         console.log("up save");
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resIns),AttchVal);
         RedisPublisher.RedisPublish(resIns, AttchVal,reqId, function (errRDS, resRDS) {
         if (errRDS) {

         console.log("read error");
         var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);



         }
         else {
         console.log(AttchVal.id);
         var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, rand2);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);




         }


         }
         );


         }



         });

         }
         else if (errIns) {

         var jsonString = messageFormatter.FormatMessage(errIns, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);

         }

         });


         }
         catch (ex) {
         logger.error('[DVP-FIleService.UploadFiles] - [%s] - Error occurred whe provision type : 1 action starts  ',reqId);
         var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);
         }


         }

         else if(ProvTyp==2)
         {
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - Profile type is selected');
         try {
         CallServerChooser.ProfileTypeCallserverChooser(Company,Tenant,reqId, function (errProf, resProf) {

         if (resProf) {

         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Uploaded File details saving starts - File - %s',reqId,JSON.stringify(file));
         DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,Company,Tenant,ref,option,Clz,Type,Category,reqId,function (errUpload, resUpload) {
         if (resUpload) {

         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resProf),AttchVal);
         RedisPublisher.RedisPublish(resProf, AttchVal, function (errRDS, resRDS) {
         if (errRDS) {
         var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);

         }
         else {
         var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resRDS);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);

         }

         }
         );


         }

         else if (errUpload) {
         var jsonString = messageFormatter.FormatMessage(errUpload, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);

         }

         });

         }
         else if (errProf) {
         var jsonString = messageFormatter.FormatMessage(errProf, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);

         }

         });


         }
         catch (ex) {
         logger.error('[DVP-FIleService.UploadFiles] - [%s] - Error occurred whe provision type : 2 action starts  ',reqId);
         var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);
         }
         }

         else
         {
         try {
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - Shared type is selected');
         CallServerChooser.SharedTypeCallsereverChooser(req.params.cmp, req.params.ten,reqId, function (errShared, resShared) {

         if (resShared) {

         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Uploaded File details saving starts - File - %s',reqId,JSON.stringify(file));
         DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,Company,Tenant,ref,option,Clz,Type,Category,reqId, function (errUpload, resUpload) {
         if (resUpload) {

         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(resShared),AttchVal);
         RedisPublisher.SharedServerRedisUpdate(resShared,AttchVal);
         var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resUpload);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);



         }

         else if (errUpload) {
         var jsonString = messageFormatter.FormatMessage(errUpload, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);
         }

         });

         }
         else if (errShared) {
         var jsonString = messageFormatter.FormatMessage(errShared, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);

         }

         });


         }
         catch (ex) {
         logger.error('[DVP-FIleService.UploadFiles] - [%s] - Error occurred when Shared type : 2 action starts  ',reqId);
         var jsonString = messageFormatter.FormatMessage(ex, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);
         }
         }*/

    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.UploadFiles] - [%s] - [HTTP] - Exception occurred when Developer file upload request starts  ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});


RestServer.post('/DVP/API/'+version+'/FileService/File/:uuid/AssignToApplication/:AppId',authorization({resource:"fileservice", action:"write"}),function(req,res,next)
{

    var reqId='';
    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    if(!req.user.company || !req.user.tenant)
    {
        var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
        logger.debug('[DVP-APPRegistry.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    var Company=req.user.company;
    var Tenant=req.user.tenant;





    DeveloperFileUpoladManager.FileAssignWithApplication(req.params.uuid,parseInt(req.params.AppId),Company,Tenant,function(errMap,resMap)
    {
        if(errMap)
        {
            //console.log(errMap);
            var jsonString = messageFormatter.FormatMessage(errMap, "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resMap);
            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        //res.end();
    });
    next();
});


RestServer.get('/DVP/API/'+version+'/FileService/File/:name/ofApplication/:AppID'/*,authorization({resource:"fileservice", action:"read"})*/,function(req,res,next)
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
   /* if(!req.user.company || !req.user.tenant)
    {
        var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
        logger.debug('[DVP-APPRegistry.PickVoiceClipByName] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    var Company=req.user.company;
    var Tenant=req.user.tenant;*/

        var Company=1;
        var Tenant=1;


        logger.debug('[DVP-FIleService.PickVoiceClipByName] - [%s] - [HTTP] - Request received - Inputs - File name : %s , AppName : %s , Tenant : %s , Company : %s',reqId,req.params.name,req.params.AppID,Tenant,Company);
        FileHandler.PickVoiceClipByName(req.params.name,req.params.AppID,Tenant,Company,reqId,function (err, resz) {
            if (err) {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickVoiceClipByName] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else {
                // console.log(resz);
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickVoiceClipByName] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        });

    }


    catch(ex) {
        logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] - [HTTP] - Exception found starting activity GetVoiceAppClipsByName  - Inputs - File name : %s , AppName : %s , Tenant : %s , Company : %s',reqId,req.params.AppID,Tenant,Company,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickVoiceClipByName] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});




RestServer.get('/DVP/API/'+version+'/FileService/File/Download/:id/:displayname'/*,authorization({resource:"fileservice", action:"read"})*/,function(req,res,next)
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

       /* if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;*/
        var Company=1;
        var Tenant=1;

        FileHandler.DownloadFileByID(res,req.params.id,req.params.displayname,option,Company,Tenant,reqId,function(errDownFile,resDownFile)
        {
            if(errDownFile)
            {
                var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                console.log("Done err");

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resDownFile);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                console.log("Done");

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

// for freeswitch compatability
RestServer.head('/DVP/API/'+version+'/FileService/File/Download/:id/:displayname'/*,authorization({resource:"fileservice", action:"read"})*/,function(req,res,next)
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

         /* if(!req.user.company || !req.user.tenant)
         {
         var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);
         }

         var Company=req.user.company;
         var Tenant=req.user.tenant;*/

        var Company=1;
        var Tenant=1;

        FileHandler.DownloadFileByID(res,req.params.id,req.params.displayname,option,Company,Tenant,reqId,function(errDownFile,resDownFile)
        {
            if(errDownFile)
            {
                var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                console.log("Done err");

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resDownFile);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                console.log("Done");

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

// appilication development phase

/*
 RestServer.del('/DVP/API/'+version+'/FileService/File/:id',function(req,res,next)
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

 logger.debug('[DVP-FIleService.DeleteFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

 FileHandler.DeleteFile(res,req.params.id,option,reqId,function(errDownFile,resDownFile)
 {
 if(errDownFile)
 {
 var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
 logger.debug('[DVP-FIleService.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
 console.log("Done err");

 }
 else
 {
 var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resDownFile);
 logger.debug('[DVP-FIleService.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
 console.log("Done");

 }

 });



 }
 catch(ex)
 {
 logger.error('[DVP-FIleService.DeleteFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
 var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
 res.end(jsonString);
 }

 return next();

 });
 */


//RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/GetAttachmentMetaData/:id',function(req,res,next)
RestServer.get('/DVP/API/'+version+'/FileService/File/MetaData/:UUID',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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



        logger.debug('[DVP-FIleService.PickAttachmentMetaData] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.UUID);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickAttachmentMetaData(req.params.UUID,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else if(resz)
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickAttachmentMetaData] - [%s] - [HTTP] - Exception occurred when starting AttachmentMetaData service - Inputs - File ID : %s ',reqId,req.params.UUID);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});


RestServer.get('/DVP/API/'+version+'/FileService/Files/Info/:appId',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.debug('[DVP-FIleService.PickFileInfo] - [%s] - [HTTP] - Request received - Inputs - APP ID : %s ',reqId,req.params.appId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFileInfo] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickFileInfo(req.params.appId,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickFileInfo] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFileInfo] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickFileInfo] - [%s] - [HTTP] - Exception occurred when starting PickFileInfo service - Inputs - File ID : %s ',reqId,req.params.appId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickFileInfo] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/:UUID/Info/:appId',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.debug('[DVP-FIleService.PickFileWithAppID] - [%s] - [HTTP] - Request received - Inputs - APP ID : %s ',reqId,req.params.appId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFileWithAppID] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        FileHandler.PickFileWithAppID(req.params.UUID,parseInt(req.params.appId),Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickFileWithAppID] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else if(resz)
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFileWithAppID] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickFileWithAppID] - [%s] - [HTTP] - Exception occurred when starting AttachmentMetaData service - Inputs - File ID : %s ',reqId,req.params.appId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickFileWithAppID] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});



//Sprint 4

RestServer.get('/DVP/API/'+version+'/FileService/Files/:SessionID',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.debug('[DVP-FIleService.PickFilesWithRefID] - [%s] - [HTTP] - Request received - Inputs - APP ID : %s ',reqId,req.params.SessionID);
        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFilesWithRefID] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickAllVoiceRecordingsOfSession(req.params.SessionID,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickFilesWithRefID] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else if(resz)
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFilesWithRefID] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickFilesWithRefID] - [%s] - [HTTP] - Exception occurred when starting PickFilesWithRefID service - Inputs - File RefID : %s ',reqId,req.params.SessionID);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickFilesWithRefID] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/Files/:SessionID/:Class/:Type/:Category',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFilesWithRefIDAndTypes] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.AllVoiceRecordingsOfSessionAndTypes(req.params.SessionID,req.params.Class,req.params.Type,req.params.Category,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - [HTTP] - Exception occurred when starting PickFilesWithRefID service - Inputs - File RefID : %s ',reqId,req.params.SessionID);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/Download/:SessionID/:Class/:Type/:Category',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFilesWithRefIDAndTypes] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.AllVoiceRecordingsOfSessionAndTypes(req.params.SessionID,req.params.Class,req.params.Type,req.params.Category,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {

                FileHandler.DownloadFileByID(res,resz.UniqueId,option,reqId,function(errDownFile,resDownFile)
                {
                    if(errDownFile)
                    {
                        var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                        console.log("Done err");

                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resDownFile);
                        logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
                        console.log("Done");

                    }

                });


            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - [HTTP] - Exception occurred when starting PickFilesWithRefID service - Inputs - File RefID : %s ',reqId,req.params.SessionID);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});



// application development phase

RestServer.get('/DVP/API/'+version+'/FileService/Files',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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



        logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - [HTTP] - Request received - ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickAllFiles] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickAllFiles(Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - [HTTP] - Exception occurred when starting PickAllFiles service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});


// app development phase

/*RestServer.get('/DVP/API/'+version+'/FileService/Files',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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



        logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - [HTTP] - Request received - ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickAllFiles] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        FileHandler.PickAllFiles(Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - [HTTP] - Exception occurred when starting PickAllFiles service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});*/

RestServer.del('/DVP/API/'+version+'/FileService/File/:id',authorization({resource:"fileservice", action:"write"}),function(req,res,next)
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



        logger.debug('[DVP-FIleService.DeleteFile] - [%s] - [HTTP] - Request received - ID: %s',reqId,req.params.id);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        FileHandler.DeleteFile(req.params.id,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.DeleteFile] - [%s] - [HTTP] - Exception occurred when starting DeleteFile service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();


});

RestServer.get('/DVP/API/'+version+'/FileService/File/Categories',authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{ var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }



        logger.debug('[DVP-FIleService.LoadCategories] - [%s] - [HTTP] - Request received - ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.LoadCategories(reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.LoadCategories] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.LoadCategories] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.LoadCategories] - [%s] - [HTTP] - Exception occurred when starting LoadCategories service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.LoadCategories] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});





/*function Crossdomain(req,res,next){


    var xml='<?xml version=""1.0""?><!DOCTYPE cross-domain-policy SYSTEM ""http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd""> <cross-domain-policy>    <allow-access-from domain=""*"" />        </cross-domain-policy>';

    /!*var xml='<?xml version="1.0"?>\n';

     xml+= '<!DOCTYPE cross-domain-policy SYSTEM "/xml/dtds/cross-domain-policy.dtd">\n';
     xml+='';
     xml+=' \n';
     xml+='\n';
     xml+='';*!/
    req.setEncoding('utf8');
    res.end(xml);

}

function Clientaccesspolicy(req,res,next){


    var xml='<?xml version="1.0" encoding="utf-8" ?>       <access-policy>        <cross-domain-access>        <policy>        <allow-from http-request-headers="*">        <domain uri="*"/>        </allow-from>        <grant-to>        <resource include-subpaths="true" path="/"/>        </grant-to>        </policy>        </cross-domain-access>        </access-policy>';
    req.setEncoding('utf8');
    res.end(xml);

}

RestServer.get("/crossdomain.xml",Crossdomain);
RestServer.get("/clientaccesspolicy.xml",Clientaccesspolicy);*/






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
