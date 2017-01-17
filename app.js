/**
 * Created by pawan on 2/23/2015.
 */
var DbConn = require('dvp-dbmodels');
var restify = require('restify');
var cors = require('cors');

//var sre = require('swagger-restify-express
var FileHandler=require('./FileHandlerApi.js');
var InternalFileHandler=require('./InternalFileHandler.js');
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

//restify.CORS.ALLOW_HEADERS.push('Access-Control-Request-Method');






var RestServer = restify.createServer({
    name: "myapp",
    version: '1.0.0'
},function(req,res)
{

});


RestServer.use(restify.CORS());
RestServer.use(restify.fullResponse());
RestServer.pre(restify.pre.userAgentConnection());


restify.CORS.ALLOW_HEADERS.push('authorization');


//Server listen
RestServer.listen(port, function () {
    console.log('%s listening at %s', RestServer.name, RestServer.url);
    //DeveloperFileUpoladManager.CouchUploader('123456','C:/Users/Pawan/Downloads/Raja_Perahera_Meda.mp3');
    //DeveloperFileUpoladManager.Reader();
    // FileHandler.downF()
    //FileHandler.testMax("checked.wav",3,1);

});
//Enable request body parsing(access)
RestServer.use(restify.bodyParser());
RestServer.use(restify.acceptParser(RestServer.acceptable));
RestServer.use(restify.queryParser());
//RestServer.use(jwt({secret: secret.Secret}));







RestServer.post('/DVP/API/'+version+'/FileService/UploadFileWithProvision/:prov',function(req,res,next)
{
// instance 1,
    // profile 2,_
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

//authorization({resource:"fileservice", action:"write"}),

RestServer.post('/DVP/API/'+version+'/FileService/File/Upload',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"write"}),function(req,res,next)
{

    // console.log(req);
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


    var prov=1;

    var Clz='';
    var Type='';
    var Category="";
    var ref="tempRef";
    var resvID="";

    if(req.body.class)
    {
        Clz=req.body.class;

    }
    if(req.body.fileCategory)
    {
        Category=req.body.fileCategory;

    }
    if(req.body.category)
    {
        Category=req.body.category;

    }

    if(req.body.type)
    {

        Type=req.body.type;
    }
    if(req.body.referenceid)
    {
        ref=req.body.referenceid;
    }

    if(req.body.reservedId)
    {
        resvID=req.body.reservedId;
    }

    try {

        /*try
         {
         reqId = uuid.v1();
         }
         catch(ex)
         {

         }*/


        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,prov,Company,Tenant);

        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        Type=file.type;

        if(req.body.mediatype && req.body.filetype){

            file.type = req.body.mediatype + "/" + req.body.filetype;
        }


        if(req.body.display){


            file.display = req.body.display;
        }

        if(req.body.filename)
        {
            file.name=req.body.filename;
        }


        logger.info('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - File path %s ',reqId,file.path);


        var ValObj={

            "tenent":Tenant,
            "company":Company,
            "filename":file.name,
            "type":file.type,
            "id":rand2

        };

        var AttchVal=JSON.stringify(ValObj);


        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s',reqId,AttchVal);


        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,Company, Tenant,ref,option,Clz,Type,Category,resvID,reqId,function (errz, respg) {


            if(errz)
            {
                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }

            else{


                logger.debug('[DVP-FIleService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(respg),AttchVal);
                RedisPublisher.RedisPublish(respg, AttchVal,reqId, function (errRDS, resRDS) {
                        if (errRDS)
                        {
                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                            logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                            res.end(jsonString);



                        }
                        else
                        {
                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, rand2);
                            logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                            res.end(jsonString);

                        }


                    }
                );


            }



        });


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

RestServer.post('/DVP/API/'+version+'/FileService/File/Reserve',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"write"}),function(req,res,next)
{

    console.log(req.body);
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
        logger.debug('[DVP-APPRegistry.ReserveFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    var Company=req.user.company;
    var Tenant=req.user.tenant;


    var prov=1;

    var Clz='';
    var Category="";
    var Display="";
    var fileName="";


    if(req.body.class)
    {
        Clz=req.body.class;

    }
    if(req.body.fileCategory)
    {
        Category=req.body.fileCategory;

    }
    if(req.body.category)
    {
        Category=req.body.category;

    }





    try {



        logger.debug('[DVP-FIleService.ReserveFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,prov,Company,Tenant);

        var rand2 = uuid.v4().toString();


        if(req.body.display){


            Display = req.body.display;
        }

        if(req.body.filename)
        {
            fileName=req.body.filename;
        }




        DeveloperFileUpoladManager.DeveloperReserveFiles(Display,fileName,rand2,Company, Tenant,Clz,Category,reqId,function (errReserve, resReserve) {


            if(errReserve)
            {
                var jsonString = messageFormatter.FormatMessage(errReserve, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.ReserveFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }

            else{


                logger.debug('[DVP-FIleService.ReserveFiles] - [%s] - File reserved id: %s',reqId,rand2);
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resReserve);
                logger.debug('[DVP-FIleService.ReserveFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);


            }



        });


    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.ReserveFiles] - [%s] - [HTTP] - Exception occurred when Developer file upload request starts  ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.ReserveFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});

RestServer.post('/DVP/API/'+version+'/FileService/File/:uuid/AssignToApplication/:AppId',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"write"}),function(req,res,next)
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

RestServer.post('/DVP/API/'+version+'/FileService/File/:uuid/DetachFromApplication',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"write"}),function(req,res,next)
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





    DeveloperFileUpoladManager.DetachFromApplication(req.params.uuid,Company,Tenant,function(errMap,resMap)
    {
        if(errMap)
        {
            //console.log(errMap);
            var jsonString = messageFormatter.FormatMessage(errMap, "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-FIleService.DetachFromApplication] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resMap);
            logger.debug('[DVP-FIleService.DetachFromApplication] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        //res.end();
    });
    next();
});


RestServer.get('/DVP/API/'+version+'/FileService/File/:name/ofApplication/:AppID',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.UploadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


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




RestServer.get('/DVP/API/'+version+'/FileService/File/Download/:id/:displayname',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';


        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        FileHandler.DownloadFileByID(res,req.params.id,req.params.displayname,option,Company,Tenant,reqId,function(errDownFile,resDownFile)
        {
            if(errDownFile)
            {
                var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);


            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resDownFile);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);


            }

        });





    return next();

});

// for freeswitch compatability
RestServer.head('/DVP/API/'+version+'/FileService/File/Download/:id/:displayname',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.status(400);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        /* var Company=1;
         var Tenant=1;*/

        FileHandler.FileInfoByID(res,req.params.id,Company,Tenant,reqId);




    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.status(400);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/DownloadLatest/:filename',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        //logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            //logger.debug('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.status(404);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        FileHandler.DownloadLatestFileByID(res,req.params.filename,option,Company,Tenant,reqId);




    }
    catch(ex)
    {
        // logger.error('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.status(404);
        res.end(jsonString);
    }

    return next();

});

RestServer.head('/DVP/API/'+version+'/FileService/File/DownloadLatest/:filename',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        //logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            // logger.debug('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.status(400);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        /* var Company=1;
         var Tenant=1;*/

        FileHandler.LatestFileInfoByID(res,req.params.filename,Company,Tenant,reqId);


    }
    catch(ex)
    {
        //logger.error('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.status(400);
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
RestServer.get('/DVP/API/'+version+'/FileService/File/MetaData/:UUID',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

RestServer.get('/DVP/API/'+version+'/FileService/File/:Filename/MetaData',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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



        logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.Filename);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickAttachmentMetaDataByName] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickAttachmentMetaDataByName(req.params.Filename,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - [HTTP] - Exception occurred when starting AttachmentMetaData service - Inputs - File ID : %s ',reqId,req.params.Filename);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/Files/Unassigned',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.debug('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - [HTTP] - Request received ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickUnassignedFilesWithPaging] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickUnassignedFilesWithPaging(Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - [HTTP] - Exception occurred when starting PickUnassignedFilesWithPaging service - ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/Files/Info/:appId',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

RestServer.get('/DVP/API/'+version+'/FileService/File/:UUID/Info/:appId',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

RestServer.get('/DVP/API/'+version+'/FileService/Files/:SessionID',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

RestServer.get('/DVP/API/'+version+'/FileService/Files/:SessionID/:Class/:Type/:Category',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

RestServer.get('/DVP/API/'+version+'/FileService/File/Download/:SessionID/:Class/:Type/:Category',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

RestServer.get('/DVP/API/'+version+'/FileService/Files',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        var assignedState = req.query.assignedState;
        var fileCategory = req.query.fileCategory;
        var fileFormat = req.query.fileFormat;

        if(fileFormat && fileCategory )
        {
            if(assignedState == "false")
            {
                console.log("Picking unassigned files");
                FileHandler.PickSpecifiedFiles(fileCategory,fileFormat,Company,Tenant,reqId,function(err,resz)
                {
                    if(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.PickSpecifiedFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                        logger.debug('[DVP-FIleService.PickSpecifiedFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }




                });
            }
            else
            {
                console.log("Picking all files with category customization");
                FileHandler.PickCategorySpecifiedFiles(fileCategory,fileFormat,Company,Tenant,reqId,function(err,resz)
                {
                    if(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.PickCategorySpecifiedFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                        logger.debug('[DVP-FIleService.PickCategorySpecifiedFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }




                });

            }


        }
        else
        {
            console.log("Picking all files");
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

RestServer.del('/DVP/API/'+version+'/FileService/File/:id',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"delete"}),function(req,res,next)
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


        FileHandler.DeleteFile(req.params.id,Company,Tenant,option,reqId,function(err,resz)
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

RestServer.get('/DVP/API/'+version+'/FileService/FileCategories',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

RestServer.get('/DVP/API/'+version+'/FileService/Files/infoByCategory/:Category',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';
    req.readable=true;

    var startDateTime='';
    var endDateTime='';

    if (req.params)
    {
        if(req.params.startDateTime)
        {
            startDateTime=req.params.startDateTime;
        }
        if(req.params.endDateTime)
        {
            endDateTime=req.params.endDateTime;
        }

    }

    if (req.query)
    {
        if(req.query.startDateTime)
        {
            startDateTime=req.query.startDateTime;
        }
        if(req.query.endDateTime)
        {
            endDateTime=req.query.endDateTime;
        }
    }


    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.PickFilesWithCategory] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFilesWithRefIDAndTypes] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        if(!(startDateTime && endDateTime))
        {
            FileHandler.AllFilesWithCategory(req.params.Category,Company,Tenant,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.PickFilesWithCategory] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.PickFilesWithCategory] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }




            });
        }
        else
        {

            FileHandler.AllFilesWithCategoryAndDateRange(req.params.Category,Company,Tenant,startDateTime,endDateTime,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryAndTimeRange] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryAndTimeRange] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }




            });

        }




    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickFilesWithCategory] - [%s] - [HTTP] - Exception occurred when starting AllFilesWithCategory service - Inputs - File Category : %s ',reqId,req.params.Category);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickFilesWithCategory] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});
RestServer.get('/DVP/API/'+version+'/FileService/Files/infoByCategoryID/:CategoryID',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';
    req.readable=true;

    var startDateTime='';
    var endDateTime='';


    if (req.query)
    {

        if(JSON.parse(req.query[0]).startDateTime)
        {
            startDateTime=JSON.parse(req.query[0]).startDateTime;
        }
        if(JSON.parse(req.query[1]).endDateTime)
        {
            endDateTime=JSON.parse(req.query[1]).endDateTime;
        }

    }


    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFilesWithCategoryIDAndTimeRange] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        if(!(startDateTime && endDateTime))
        {
            FileHandler.FilesWithCategoryId(req.params.CategoryID,Company,Tenant,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }




            });
        }
        else
        {

            FileHandler.FilesWithCategoryAndDateRange(req.params.CategoryID,Company,Tenant,startDateTime,endDateTime,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }




            });

        }




    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickFilesWithCategory] - [%s] - [HTTP] - Exception occurred when starting AllFilesWithCategory service - Inputs - File Category : %s ',reqId,req.params.Category);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickFilesWithCategory] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});
RestServer.get('/DVP/API/'+version+'/FileService/FilesInfo/Category/:CategoryID/:rowCount/:pageNo',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.debug('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFilesWithCategoryID] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.AllFilesWithCategoryID(req.params.CategoryID,req.params.rowCount,req.params.pageNo,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - [HTTP] - Exception occurred when starting AllFilesWithCategory service - Inputs - File Category : %s ',reqId,req.params.Category);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/Files/:rowCount/:pageNo',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.debug('[DVP-FIleService.AllFilesWithPaging] - [%s] - [HTTP] - Request received ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.AllFilesWithPaging] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickAllFilesWithPaging(req.params.rowCount,req.params.pageNo,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.AllFilesWithPaging] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.AllFilesWithPaging] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.AllFilesWithPaging] - [%s] - [HTTP] - Exception occurred when starting AllFilesWithPaging service - ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.AllFilesWithPaging] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/Count/Category/:categoryID',jwt({secret: secret.Secret}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{console.log("hit");

    var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        // logger.debug('[DVP-FIleService.AllCats] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.AllCats] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        /*FileHandler.PickFileCountsOFCategories(Company,Tenant,function(err,resz)
         {
         if(err)
         {
         var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
         logger.debug('[DVP-FIleService.AllCats] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);
         }
         else
         {
         var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
         logger.debug('[DVP-FIleService.AllCats] - [%s] - Request response : %s ', reqId, jsonString);
         res.end(jsonString);
         }




         });*/
        FileHandler.PickFileCountsOFCategories(req.params.categoryID,Company,Tenant, function (e,r) {

            if(e)
            {
                logger.debug('[DVP-FIleService.CategoryCount] - [%s] - [HTTP] - Exception occurred when starting AllFilesWithCategory service - Inputs - File CategoryID : %s ',reqId,req.params.categoryID);
                var jsonString = messageFormatter.FormatMessage(e, "EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.AllCats] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);


            }
            else
            {
                logger.debug('[DVP-FIleService.CategoryCount] - [%s] - [HTTP] - Success AllFilesWithCategory service - Inputs - File CategoryID : %s ',reqId,req.params.categoryID);
                var jsonString = messageFormatter.FormatMessage(null, "SUCCESS", true, r);
                logger.debug('[DVP-FIleService.AllCats] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);

            }
        });

    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.AllCats] - [%s] - [HTTP] - Exception occurred when starting AllFilesWithCategory service - Inputs - File Category : %s ',reqId,req.params.Category);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.AllCats] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});


// Internal file service services

RestServer.get('/DVP/API/'+version+'/InternalFileService/File/Download/:tenant/:company/:id/:displayname',function(req,res,next)
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

        logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        var Company=req.params.company;
        var Tenant=req.params.tenant;


        InternalFileHandler.DownloadFileByID(res,req.params.id,req.params.displayname,option,Company,Tenant,reqId,function(errDownFile,resDownFile)
        {
            if(errDownFile)
            {
                var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);


            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resDownFile);
                logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);


            }

        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.end(jsonString);
    }

    return next();

});

RestServer.head('/DVP/API/'+version+'/InternalFileService/File/Download/:tenant/:company/:id/:displayname',function(req,res,next)
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

        logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        var Company=req.params.company;
        var Tenant=req.params.tenant;


        InternalFileHandler.FileInfoByID(res,req.params.id,Company,Tenant,reqId);




    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.status(400);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/InternalFileService/File/DownloadLatest/:tenant/:company/:filename',function(req,res,next)
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

        //logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        var Company=req.params.company;
        var Tenant=req.params.tenant;


        InternalFileHandler.DownloadLatestFileByID(res,req.params.filename,option,Company,Tenant,reqId);


    }
    catch(ex)
    {
        // logger.error('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.status(404);
        res.end(jsonString);
    }

    return next();

});

RestServer.head('/DVP/API/'+version+'/InternalFileService/File/DownloadLatest/:tenant/:company/:filename',function(req,res,next)
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

        //logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        var Company=req.params.company;
        var Tenant=req.params.tenant;


        InternalFileHandler.LatestFileInfoByID(res,req.params.filename,Company,Tenant,reqId);


    }
    catch(ex)
    {
        //logger.error('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Error in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.status(400);
        res.end(jsonString);
    }

    return next();

});

RestServer.put('/DVP/API/'+version+'/InternalFileService/File/Upload/:tenant/:company',function(req,res,next)
{

    var reqId='';
    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    var Company=req.params.company;
    var Tenant=req.params.tenant;

    var prov=1;

    var Clz='';
    var Type='';
    var Category="";
    var ref="";
    var FileStructure="";
    var FilePath="";
    var FileName="";
    var BodyObj="";
    var DisplayName="";


    req.readable=true;

    console.log("params "+req.params);
    console.log("body "+req.body);
    console.log("query "+req.query);


    if (req.params)
    {
        if (req.params.class) {
            Clz = req.params.class;

        }
        if (req.params.type) {

            Type = req.params.type;
        }
        if (req.params.category) {
            Category = req.params.category;

        }
        if (req.params.referenceid) {
            ref = req.params.referenceid;
        }
        if (req.params.fileCategory) {
            Category = req.params.fileCategory;

        }
    }

    if(req.query)
    {
        if(req.query.put_file)
        {
            FilePath=req.query.put_file;
        }

        if(req.query.class)
        {
            Clz=req.query.class;
        }
        if(req.query.type)
        {
            Type=req.query.type;
        }
        if(req.query.category)
        {
            Category=req.query.category;
        }
        if(req.query.sessionid)
        {
            ref=req.query.sessionid;
        }
        if(req.query.mediatype && req.query.filetype)
        {
            if(req.query.filetype=="wav" || req.query.filetype=="mp3")
            {
                FileStructure="audio/"+req.query.filetype;
            }
            else
            {
                FileStructure=req.query.mediatype+"/"+req.query.filetype;
            }

        }
        if(req.query.sessionid && req.query.filetype)
        {
            FileName=req.query.sessionid+"."+req.query.filetype;
        }
        if(req.query.display)
        {
            DisplayName=req.query.display;
        }


    }

    if(req.body)
    {
        if (req.body.class) {
            Clz = req.body.class;

        }
        if (req.body.fileCategory) {
            Category = req.body.fileCategory;

        }
        if (req.body.category) {
            Category = req.body.category;

        }

        if (req.body.type) {

            Type = req.body.type;
        }
        if (req.body.referenceid) {
            ref = req.body.referenceid;
        }
        if(req.body.display)
        {
            DisplayName=req.body.display;
        }


        if(req.body.mediatype && req.body.filetype)
        {
            if(req.body.filetype=="wav" || req.body.filetype=="mp3")
            {
                FileStructure="audio/"+req.body.filetype;
            }
            else
            {
                FileStructure=req.body.mediatype+"/"+req.body.filetype;
            }

        }


        BodyObj=req.body;
    }

    try {

        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,prov,Company,Tenant);
        var rand2 = uuid.v4().toString();
        /* var fileKey = Object.keys(req.files)[0];
         var file = req.files[fileKey];*/

        logger.info('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - File path %s ',reqId,FilePath);

        var ValObj={

            "tenent":Tenant,
            "company":Company,
            "filename":FileName,
            "type":Type,
            "id":rand2

        };

        var file=
        {
            fClass:Clz,
            type:Type,
            fCategory:Category,
            fRefID:ref,
            fStructure:FileStructure,
            path:FilePath,
            name:FileName,
            displayname:DisplayName
        };


        var AttchVal=JSON.stringify(ValObj);


        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s',reqId,AttchVal);

        //DeveloperFileUpoladManager.InternalUploadFiles(file,rand2,Company, Tenant,option,req,reqId,function (errz, respg)
        InternalFileHandler.InternalUploadFiles(file,rand2,Company, Tenant,option,req,reqId,function (errz, respg)
        {
            if(errz)
            {
                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                logger.debug('[DVP-FIleService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(respg),AttchVal);
                RedisPublisher.RedisPublish(respg, AttchVal,reqId, function (errRDS, resRDS) {
                    if (errRDS)
                    {
                        var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, rand2);
                        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }


                });
            }

        });

    }
    catch(ex)
    {
        var x = JSON.parse(req);
        console.log(JSON.stringify(x));
        logger.error('[DVP-FIleService.UploadFiles] - [%s] - [HTTP] - Exception occurred when Developer file upload request starts  ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(JSON.stringify(x));
    }
    return next();
});

RestServer.post('/DVP/API/'+version+'/InternalFileService/File/Upload/:tenant/:company',function(req,res,next)
{

    var reqId='';
    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=req.params.company;
    var Tenant=req.params.tenant;


    var prov=1;
    var Clz='';
    var Type='';
    var Category="";
    var ref="";
    var FileStructure="";
    var FilePath="";
    var FileName="";
    var BodyObj="";
    var DisplayName="";
    var Display="";


    req.readable=true;


    if (req.params)
    {
        if (req.params.class) {
            Clz = req.params.class;

        }
        if (req.params.type) {

            Type = req.params.type;
        }
        if (req.params.category) {
            Category = req.params.category;

        }
        if (req.params.referenceid) {
            ref = req.params.referenceid;
        }
        if (req.params.fileCategory) {
            Category = req.params.fileCategory;

        }
    }

    if(req.query)
    {
        if(req.query.put_file)
        {
            FilePath=req.query.put_file;
        }

        if(req.query.class)
        {
            Clz=req.query.class;
        }
        if(req.query.type)
        {
            Type=req.query.type;
        }
        if(req.query.category)
        {
            Category=req.query.category;
        }
        if(req.query.sessionid)
        {
            ref=req.query.sessionid;
        }
        if(req.query.mediatype && req.query.filetype)
        {
            if(req.query.filetype=="wav" || req.query.filetype=="mp3")
            {
                FileStructure="audio/"+req.query.filetype;
            }
            else
            {
                FileStructure=req.query.mediatype+"/"+req.query.filetype;
            }

        }
        if(req.query.sessionid && req.query.filetype)
        {
            FileName=req.query.sessionid+"."+req.query.filetype;
        }
        if(req.query.display)
        {
            DisplayName=req.query.display;
        }


    }

    if(req.body)
    {
        if (req.body.class) {
            Clz = req.body.class;

        }
        if (req.body.fileCategory) {
            Category = req.body.fileCategory;

        }
        if (req.body.category) {
            Category = req.body.category;

        }

        if (req.body.type) {

            Type = req.body.type;
        }
        if (req.body.referenceid) {
            ref = req.body.referenceid;
        }
        if(req.body.mediatype && req.body.filetype)
        {
            if(req.body.filetype=="wav" || req.body.filetype=="mp3")
            {
                FileStructure="audio/"+req.body.filetype;
            }
            else
            {
                FileStructure=req.body.mediatype+"/"+req.body.filetype;
            }
        }
        if(req.body.display)
        {
            DisplayName=req.body.display;
        }

        BodyObj=req.body;
    }




    if (req.body) {
        if (req.body.class) {
            Clz = req.body.class;
        }
        if (req.body.fileCategory) {
            Category = req.body.fileCategory;
        }
        if (req.body.category) {
            Category = req.body.category;

        }
        if (req.body.type) {

            Type = req.body.type;
        }
        if (req.body.referenceid) {
            ref = req.body.referenceid;
        }
        if(req.body.display) {
            Display=req.body.display;
        }
    }
    if (req.params) {
        if (req.params.class) {
            Clz = req.params.class;

        }
        if (req.params.type) {

            Type = req.params.type;
        }
        if (req.params.category) {
            Category = req.params.category;

        }
        if (req.params.referenceid) {
            ref = req.params.referenceid;
        }
        if (req.params.fileCategory) {
            Category = req.params.fileCategory;

        }
    }

    try {
        logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,prov,Company,Tenant);
        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var attachedFile = req.files[fileKey];
        // FileStructure=attachedFile.type;
        FileName=attachedFile.name;
        FilePath=attachedFile.path;

        var DisplyArr = attachedFile.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];


        logger.info('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - [FILEUPLOAD] - File path %s ',reqId,FilePath);

        var ValObj={

            "tenent":Tenant,
            "company":Company,
            "filename":FileName,
            "type":Type,
            "id":rand2

        };

        var file=
        {
            fClass:Clz,
            type:Type,
            fCategory:Category,
            fRefID:ref,
            fStructure:FileStructure,
            path:FilePath,
            name:FileName,
            displayname:Display
        };

        console.log("File Data "+file);


        var AttchVal=JSON.stringify(ValObj);


        logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s',reqId,AttchVal);


        //DeveloperFileUpoladManager.InternalUploadFiles(file,rand2,Company, Tenant,option,req,reqId,function (errz, respg)
        InternalFileHandler.InternalUploadFiles(file,rand2,Company, Tenant,option,req,reqId,function (errz, respg)

        {
            if(errz)
            {
                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }

            else{


                logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s',reqId,JSON.stringify(respg),AttchVal);
                RedisPublisher.RedisPublish(respg, AttchVal,reqId, function (errRDS, resRDS) {
                    if (errRDS)
                    {
                        var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, rand2);
                        logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);

                    }

                });
            }

        });


    }
    catch(ex)
    {
        var x = JSON.parse(req);
        console.log(JSON.stringify(x));
        logger.error('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - [HTTP] - Exception occurred when Developer file upload request starts  ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(JSON.stringify(x));
    }
    return next();
});

RestServer.get('/DVP/API/'+version+'/InternalFileService/File/Thumbnail/:tenant/:company/:id/:displayname',function(req,res,next)
{
    var reqId='';
    var thumbSize='100';

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        var Company=req.params.company;
        var Tenant=req.params.tenant;

    if(req.params.sz)
    {
        thumbSize=req.params.sz;
    }


        InternalFileHandler.DownloadThumbnailByID(res,req.params.id,option,Company,Tenant,thumbSize,reqId,function(errDownFile,resDownFile)
        {
            if(errDownFile)
            {
                var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);


            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resDownFile);
                logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);


            }

        });





    return next();

});


function Crossdomain(req,res,next){


    var xml='<?xml version=""1.0""?><!DOCTYPE cross-domain-policy SYSTEM ""http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd""> <cross-domain-policy>    <allow-access-from domain=""*"" />        </cross-domain-policy>';

    var xml='<?xml version="1.0"?>\n';

    xml+= '<!DOCTYPE cross-domain-policy SYSTEM "/xml/dtds/cross-domain-policy.dtd">\n';
    xml+='';
    xml+=' \n';
    xml+='\n';
    xml+='';
    req.setEncoding('utf8');
    res.end(xml);

}

function Clientaccesspolicy(req,res,next){


    var xml='<?xml version="1.0" encoding="utf-8" ?>       <access-policy>        <cross-domain-access>        <policy>        <allow-from http-request-headers="*">        <domain uri="*"/>        </allow-from>        <grant-to>        <resource include-subpaths="true" path="/"/>        </grant-to>        </policy>        </cross-domain-access>        </access-policy>';
    req.setEncoding('utf8');
    res.end(xml);

}

RestServer.get("/crossdomain.xml",Crossdomain);
RestServer.get("/clientaccesspolicy.xml",Clientaccesspolicy);




