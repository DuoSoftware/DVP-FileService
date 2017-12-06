/**
 * Created by pawan on 2/23/2015.
 */
var DbConn = require('dvp-dbmodels');
var restify = require('restify');
var cors = require('cors');
var FileHandler=require('./FileHandlerApi.js');
var InternalFileHandler=require('./InternalFileHandler.js');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var CallServerChooser=require('./CallServerChooser.js');
var RedisPublisher=require('./RedisPublisher.js');
var DeveloperFileUpoladManager=require('./DeveloperFileUpoladManager.js');
var uuid = require('node-uuid');
var fs=require('fs');
var path = require('path');
var jwt = require('restify-jwt');
var secret = require('dvp-common/Authentication/Secret.js');
var authorization = require('dvp-common/Authentication/Authorization.js');
//...............................................
restify.CORS.ALLOW_HEADERS.push('authorization');
var config = require('config');

var port = config.Host.port || 3000;

var version=config.Host.version;
var hpath=config.Host.hostpath;
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;


var option = config.Option;



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


//
//RestServer.use(jwt({secret: secret.Secret,
//    getToken: GetToken}));
//


var GetToken = function fromHeaderOrQuerystring (req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0].toLowerCase() === 'bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.params && req.params.Authorization) {
        return req.params.Authorization;
    } else if (req.query && req.query.Authorization) {
        return req.query.Authorization;
    }
    return null;
}


RestServer.post('/DVP/API/'+version+'/FileService/File/Upload',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"write"}),function(req,res,next)
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
        logger.error('[DVP-APPRegistry.UploadFiles] - [%s] - Invalid Authorization details found  ', reqId);
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
    var encripNeeded=false;

    var upldFileKey = Object.keys(req.files)[0];
    var attachedFile = req.files[upldFileKey];
    var tempPath = req.files[upldFileKey].path;

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


        logger.debug('[DVP-FIleService.UploadFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,prov,Company,Tenant);

        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];

        if(file.type)
        {
            Type=file.type;
        }


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


        var fileObj =
            {
                Fobj:file,
                rand2:rand2,
                cmp:Company,
                ten:Tenant,
                ref:ref,
                option:option,
                Clz:Clz,
                Type:Type,
                Category:Category,
                resvID:resvID,
                reqId:reqId

            }


        DeveloperFileUpoladManager.DeveloperUploadFiles(fileObj,function (errz, respg,tempPath) {

            if(tempPath)
            {
                fs.unlink(path.join(tempPath),function (errUnlink) {

                    if(errUnlink)
                    {
                        console.log("Error status Removing Temp file",errUnlink);
                    }
                    else
                    {
                        console.log("Temp file removed successfully");
                    }


                });
            }

            if(errz)
            {
                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.UploadFiles] - [%s] - Failed to upload file : %s ', reqId, jsonString);
                res.end(jsonString);
            }

            else{


                logger.debug('[DVP-FIleService.UploadFiles] - [%s] - File uploaded successfully',reqId,AttchVal);
                RedisPublisher.RedisPublish(respg, AttchVal,reqId, function (errRDS, resRDS) {
                        if (errRDS)
                        {
                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                            logger.error('[DVP-FIleService.UploadFiles] - [%s] - Failed to publish on redis : %s ', reqId, jsonString);
                            res.end(jsonString);

                        }
                        else
                        {
                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, rand2);
                            logger.debug('[DVP-FIleService.UploadFiles] - [%s] - Successfully published on redis ', reqId);
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
        logger.error('[DVP-FIleService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
        var unlinkPath="";

        if(attachedFile.tempPath)
        {
            unlinkPath=attachedFile.tempPath;
        }
        else
        {
            unlinkPath=tempPath;
        }


        fs.unlink(path.join(unlinkPath),function (errUnlink) {

            if(errUnlink)
            {
                console.log("Error status Removing Temp file",errUnlink);
            }
            else
            {
                console.log("Temp file removed successfully");
            }


        });

        res.end(jsonString);
    }
    return next();
});

RestServer.post('/DVP/API/'+version+'/FileService/File/Reserve',jwt({secret: secret.Secret, getToken: GetToken}),authorization({resource:"fileservice", action:"write"}),function(req,res,next)
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
        logger.error('[DVP-APPRegistry.ReserveFiles] - [%s] - Invalid Authorization details found  ', reqId);
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
                logger.error('[DVP-FIleService.ReserveFiles] - [%s] - Error in reserving files : %s ', reqId, jsonString);
                res.end(jsonString);
            }

            else{


                logger.debug('[DVP-FIleService.ReserveFiles] - [%s] - File reserved id: %s',reqId,rand2);
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resReserve);
                logger.debug('[DVP-FIleService.ReserveFiles] - [%s] - Successfully file reserved : %s ', reqId, jsonString);
                res.end(jsonString);


            }



        });


    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.ReserveFiles] - [%s] - [HTTP] - Exception occurred when Developer file upload request starts  ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.ReserveFiles] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});

RestServer.post('/DVP/API/'+version+'/FileService/File/:uuid/AssignToApplication/:AppId',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"write"}),function(req,res,next)
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
        logger.error('[DVP-APPRegistry.UploadFile] - [%s] - Invalid Authorization details found  ', reqId);
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
            logger.error('[DVP-FIleService.UploadFile] - [%s] - Error in assigning application : %s ', reqId, jsonString);
            res.end(jsonString);
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resMap);
            logger.debug('[DVP-FIleService.UploadFile] - [%s] - Successfully application assigned with file ', reqId);
            res.end(jsonString);
        }

        //res.end();
    });
    next();
});

RestServer.post('/DVP/API/'+version+'/FileService/File/:uuid/DetachFromApplication',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"write"}),function(req,res,next)
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
        logger.error('[DVP-APPRegistry.UploadFile] - [%s] - Invalid Authorization details found  ', reqId);
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
            logger.error('[DVP-FIleService.DetachFromApplication] - [%s] - Error in detaching file from application ', reqId, jsonString);
            res.end(jsonString);
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resMap);
            logger.debug('[DVP-FIleService.DetachFromApplication] - [%s] - File successfully detached from application ', reqId);
            res.end(jsonString);
        }

        //res.end();
    });
    next();
});


RestServer.get('/DVP/API/'+version+'/FileService/File/:name/ofApplication/:AppID',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.UploadFile] - [%s] - Invalid Authorization details found ', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        logger.debug('[DVP-FIleService.PickVoiceClipByName] - [%s] - [HTTP] - Request received - Inputs - File name : %s , AppName : %s , Tenant : %s , Company : %s',reqId,req.params.name,req.params.AppID,Tenant,Company);
        FileHandler.PickVoiceClipByName(req.params.name,req.params.AppID,Tenant,Company,reqId,function (err, resz) {
            if (err) {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] -Error in searching File by name %s', reqId, jsonString);
                res.end(jsonString);
            }
            else {
                // console.log(resz);
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickVoiceClipByName] - [%s] - File found ', reqId);
                res.end(jsonString);
            }
        });

    }


    catch(ex) {
        logger.error('[DVP-FIleService.PickVoiceClipByName] - [%s] - [HTTP] - Exception found starting activity GetVoiceAppClipsByName  - Inputs - File name : %s , AppName : %s , Tenant : %s , Company : %s',reqId,req.params.AppID,Tenant,Company,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.PickVoiceClipByName] - [%s] - Exception in searching file by name : %s ', reqId, jsonString);
        res.end(jsonString);
    }
    return next();
});




RestServer.get('/DVP/API/'+version+'/FileService/File/Download/:id/:displayname',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';
    var userType ="Other";


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
        logger.error('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    var Company=req.user.company;
    var Tenant=req.user.tenant;


    var fileObj =
        {
            id:req.params.id,
            option:option,
            Company:Company,
            Tenant:Tenant,
            userType:userType,
            reqId:reqId,
            method:"DEFAULT"
        }

    FileHandler.DownloadFileByID(res,fileObj);
    return next();

});

// for freeswitch compatability
RestServer.head('/DVP/API/'+version+'/FileService/File/Download/:id/:displayname',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.DownloadFile] - [%s] - Invalid Authorization details found  ', reqId, jsonString);
            res.status(400);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.FileInfoByID(res,req.params.id,Company,Tenant,reqId);




    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Exception in Request - Inputs - File ID : %s ',reqId,req.params.id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.status(400);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/DownloadLatest/:filename',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';
    var category="";

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
            logger.error('[DVP-FIleService.DownloadLatest] - [%s] - Invalid Authorization details found ', reqId);
            res.status(404);
            res.end(jsonString);
        }
        if (req.query && req.query.category)
        {

            category=req.query.category;

        }


        var Company=req.user.company;
        var Tenant=req.user.tenant;

        var fileObj =
            {
                FileName:req.params.filename,
                option:option,
                Company:Company,
                Tenant:Tenant,
                method:"DEFAULT",
                reqId:reqId,
                category:category


            }


        FileHandler.DownloadLatestFileByID(res,fileObj);




    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [HTTP] - Exception found  %s ',reqId,jsonString);
        res.status(404);
        res.end(jsonString);
    }

    return next();

});

RestServer.head('/DVP/API/'+version+'/FileService/File/DownloadLatest/:filename',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-FIleService.DownloadLatest] - [%s] - Invalid Authorization details found', reqId);
            res.status(400);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        FileHandler.LatestFileInfoByID(res,req.params.filename,Company,Tenant,reqId);


    }
    catch(ex)
    {
        //
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.DownloadLatest] - [%s] - [HTTP] - Exception found  %s ',reqId,jsonString);
        res.status(400);
        res.end(jsonString);
    }

    return next();

});


//RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/GetAttachmentMetaData/:id',function(req,res,next)
RestServer.get('/DVP/API/'+version+'/FileService/File/MetaData/:UUID',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.DownloadFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickAttachmentMetaData(req.params.UUID,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Error in Searching meta data : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Meta data found ', reqId);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickAttachmentMetaData] - [%s] - Exception in operator ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/:Filename/MetaData',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.PickAttachmentMetaDataByName] - [%s] - Invalid Authorization details found', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickAttachmentMetaDataByName(req.params.Filename,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Error in searching meta data : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Meta data found ', reqId);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - [HTTP] - Exception occurred when starting AttachmentMetaData service - Inputs - File ID : %s ',reqId,req.params.Filename);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickAttachmentMetaDataByName] - [%s] - Exception occurred : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/Files/Unassigned',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.PickUnassignedFilesWithPaging] - [%s] - Invalid Authorization details found', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickUnassignedFilesWithPaging(Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - Error in searching unassigned files : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - Unassigned files found ', reqId);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - [HTTP] - Exception occurred when starting PickUnassignedFilesWithPaging service - ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickUnassignedFilesWithPaging] - [%s] - Exception occurred : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/Files/Info/:appId',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.PickFileInfo] - [%s] - Invalid Authorization details found', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickFileInfo(req.params.appId,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickFileInfo] - [%s] - Error in picking file info : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFileInfo] - [%s] -File info received : %s ', reqId);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.PickFileInfo] - [%s] - [HTTP] - Exception occurred when starting PickFileInfo service - Inputs - File ID : %s ',reqId,req.params.appId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickFileInfo] - [%s] - Exception occurred : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/:UUID/Info/:appId',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.PickFileWithAppID] - [%s] - Invalid Authorization details found : %s ', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        FileHandler.PickFileWithAppID(req.params.UUID,parseInt(req.params.appId),Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickFileWithAppID] - [%s] - Error in searching file with App ID : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFileWithAppID] - [%s] - Files found ', reqId);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.PickFileWithAppID] - [%s] - [HTTP] - Exception occurred when starting AttachmentMetaData service - Inputs - File ID : %s ',reqId,req.params.appId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickFileWithAppID] - [%s] - Exception occurred : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});



//Sprint 4

RestServer.get('/DVP/API/'+version+'/FileService/Files/:SessionID',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.PickFilesWithRefID] - [%s] - Invalid Authorization details found ', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.PickAllVoiceRecordingsOfSession(req.params.SessionID,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickFilesWithRefID] - [%s] - Error in searching files of session ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFilesWithRefID] - [%s] - Files found for session ', reqId);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.PickFilesWithRefID] - [%s] - [HTTP] - Exception occurred when starting PickFilesWithRefID service - Inputs - File RefID : %s ',reqId,req.params.SessionID);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickFilesWithRefID] - [%s] - Exception occurred : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/Files/:SessionID/:Class/:Type/:Category',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.PickFilesWithRefIDAndTypes] - [%s] - Invalid Authorization details found ', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.AllVoiceRecordingsOfSessionAndTypes(req.params.SessionID,req.params.Class,req.params.Type,req.params.Category,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Error in searching files with session and type ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Files found ', reqId);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - [HTTP] - Exception occurred when starting PickFilesWithRefID service - Inputs - File RefID : %s ',reqId,req.params.SessionID);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Exception occurred : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/Download/:SessionID/:Class/:Type/:Category',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';
    var userType="Other";
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
            logger.error('[DVP-APPRegistry.PickFilesWithRefIDAndTypes] - [%s] - Invalid Authorization details found ', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.AllVoiceRecordingsOfSessionAndTypes(req.params.SessionID,req.params.Class,req.params.Type,req.params.Category,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Error in searching files : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                if(resz)
                {
                    var fileObj =
                        {
                            id:resz.UniqueId,
                            option:option,
                            Company:Company,
                            Tenant:Tenant,
                            userType:userType,
                            reqId:reqId,
                            method:"DEFAULT"
                        }

                    FileHandler.DownloadFileByID(res,fileObj);
                }
                else
                {
                    logger.debug('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - [HTTP] - Exception occurred when starting PickFilesWithRefID service - Inputs - File RefID : %s ',reqId,req.params.SessionID);
                    var jsonString = messageFormatter.FormatMessage(new Error("No records found"), "EXCEPTION", false, undefined);
                    res.end(jsonString);
                }


            }


        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - [HTTP] - Exception occurred when starting PickFilesWithRefID service - Inputs - File RefID : %s ',reqId,req.params.SessionID);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickFilesWithRefIDAndTypes] - [%s] - Exception occurred : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});



// application development phase

RestServer.get('/DVP/API/'+version+'/FileService/Files',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        var isVisibleCat = false;

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.PickAllFiles] - [%s] - Invalid Authorization details found ', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        var assignedState = req.query.assignedState;
        var fileCategory = req.query.fileCategory;
        var fileFormat = req.query.fileFormat;
        if(req.query.visibleSt)
        {
            isVisibleCat=req.query.visibleSt;
        }


        if(fileFormat && fileCategory )
        {
            if(assignedState == "false")
            {
                console.log("Picking unassigned files");
                FileHandler.PickSpecifiedFiles(fileCategory,fileFormat,Company,Tenant,isVisibleCat,reqId,function(err,resz)
                {
                    if(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.error('[DVP-FIleService.PickSpecifiedFiles] - [%s] - Error in searching files : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                        logger.debug('[DVP-FIleService.PickSpecifiedFiles] - [%s] - Files found ', reqId);
                        res.end(jsonString);
                    }


                });
            }
            else
            {
                console.log("Picking all files with category customization");
                FileHandler.PickCategorySpecifiedFiles(fileCategory,fileFormat,Company,Tenant,isVisibleCat,reqId,function(err,resz)
                {
                    if(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                        logger.error('[DVP-FIleService.PickCategorySpecifiedFiles] - [%s] - Error in category specific files : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                        logger.debug('[DVP-FIleService.PickCategorySpecifiedFiles] - [%s] - Category specific files found ', reqId);
                        res.end(jsonString);
                    }



                });

            }


        }
        else
        {

            console.log("Picking all files");
            FileHandler.PickAllFiles(Company,Tenant,isVisibleCat,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.error('[DVP-FIleService.PickAllFiles] - [%s] - Error in picking files : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.PickAllFiles] - [%s] - Files found : %s ', reqId);
                    res.end(jsonString);
                }


            });
        }




    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.PickAllFiles] - [%s] - [HTTP] - Exception occurred when starting PickAllFiles service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickAllFiles] - [%s] - Exception occurred : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.post('/DVP/API/'+version+'/FileService/Files/:rowCount/:pageNo',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    console.log("hitt");
    var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }



        logger.debug('[DVP-FIleService.PickFilesByCategoryList] - [%s] - [HTTP] - Request received - ',reqId);



        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.PickFilesByCategoryList] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;





        console.log("Picking all files");
        FileHandler.PickFilesByCategoryList(req.params.rowCount,req.params.pageNo,Company,Tenant,req,reqId,function(err,resz)
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

RestServer.get('/DVP/API/'+version+'/FileService/VisibleFiles',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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



        logger.debug('[DVP-FIleService.VisibleFiles] - [%s] - [HTTP] - Request received - ',reqId);

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

RestServer.del('/DVP/API/'+version+'/FileService/File/:id',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"delete"}),function(req,res,next)
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

RestServer.post('/DVP/API/'+version+'/FileService/FileCategory',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{ var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }



        logger.debug('[DVP-FIleService.SaveNewCategory] - [%s] - [HTTP] - Request received - ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.SaveNewCategory(req.body,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.SaveNewCategory] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.SaveNewCategory] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.SaveNewCategory] - [%s] - [HTTP] - Exception occurred when starting LoadCategories service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.SaveNewCategory] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/FileCategories',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.debug('[DVP-APPRegistry.DeleteFile] - [%s] - Invalid Authorization details found  ', reqId);
            res.end(jsonString);
        }

        FileHandler.LoadCategories(reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.LoadCategories] - [%s] - Error in searching file categories', reqId);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.LoadCategories] - [%s] - File categories found ', reqId);
                res.end(jsonString);
            }


        });


    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.LoadCategories] - [%s] - [HTTP] - Exception occurred when starting LoadCategories service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        res.end(jsonString);
    }

    return next();

});

RestServer.put('/DVP/API/'+version+'/FileService/FileCategory/:CategoryID',jwt({secret: secret.Secret, getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{ var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }



        logger.debug('[DVP-FIleService.UpdateCategory] - [%s] - [HTTP] - Request received - ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-APPRegistry.DeleteFile] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.UpdateCategory(req.params.CategoryID,req.body.CatData,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.debug('[DVP-FIleService.UpdateCategory] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.UpdateCategory] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        logger.debug('[DVP-FIleService.UpdateCategory] - [%s] - [HTTP] - Exception occurred when starting LoadCategories service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.debug('[DVP-FIleService.UpdateCategory] - [%s] - Request response : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});



RestServer.get('/DVP/API/'+version+'/FileService/Files/infoByCategory/:Category',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.PickFilesWithRefIDAndTypes] - [%s] - Invalid Authorization details found : %s ', reqId);
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
                    logger.error('[DVP-FIleService.PickFilesWithCategory] - [%s] - Error in searching Files with category : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.error('[DVP-FIleService.PickFilesWithCategory] - [%s] - Files found ', reqId);
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
                    logger.error('[DVP-FIleService.PickFilesWithCategoryAndTimeRange] - [%s] - Error in searching file with category and Time range : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryAndTimeRange] - [%s] - Files found ', reqId);
                    res.end(jsonString);
                }




            });

        }




    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickFilesWithCategory] - [%s] - Exception in operation : %s ', reqId);
        res.end(jsonString);
    }

    return next();

});
RestServer.get('/DVP/API/'+version+'/FileService/Files/infoByCategoryID/:CategoryID',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
            logger.error('[DVP-APPRegistry.PickFilesWithCategoryIDAndTimeRange] - [%s] - Invalid Authorization details found  : %s ', reqId);
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
                    logger.error('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - Error in searching files : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - Files found ', reqId);
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
                    logger.error('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - Error in searching files with Category and Time range : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.PickFilesWithCategoryIDAndTimeRange] - [%s] - File found ', reqId);
                    res.end(jsonString);
                }




            });

        }




    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickFilesWithCategory] - [%s] - Exception in operation  : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.post('/DVP/API/'+version+'/FileService/FileInfo/ByCategoryList',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';
    req.readable=true;

    var startDateTime='';
    var endDateTime='';


    if (req.query && req.query.startDateTime && req.query.endDateTime)
    {

        startDateTime=req.query["startDateTime"];
        endDateTime=req.query["endDateTime"];

    }


    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.infoByCategoryList] - [%s] - Invalid Authorization details found  ', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        if(!(startDateTime && endDateTime))
        {
            FileHandler.FilesWithCategoryList(req,Company,Tenant,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.error('[DVP-FIleService.infoByCategoryList] - [%s] - Error in searching files with category list : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - files returned given with category list ', reqId);
                    res.end(jsonString);
                }




            });
        }
        else
        {

            FileHandler.FilesWithCategoryListAndDateRange(req,Company,Tenant,startDateTime,endDateTime,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }




            });

        }




    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.infoByCategoryList] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.post('/DVP/API/'+version+'/FileService/FileInfo/ByCategoryList/count',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';
    req.readable=true;

    var startDateTime='';
    var endDateTime='';


    if (req.query && req.query.startDateTime && req.query.endDateTime)
    {

        startDateTime=req.query["startDateTime"];
        endDateTime=req.query["endDateTime"];

    }


    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.infoByCategoryList] - [%s] - Request response : %sInvalid Authorization details found  ', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        if(!(startDateTime && endDateTime))
        {
            FileHandler.FilesWithCategoryList(req,Company,Tenant,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.error('[DVP-FIleService.infoByCategoryList] - [%s] - Error in searching files with category list : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    if(resz)
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz.length);
                        logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Files returned with category list ', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(new Error("No data returned"), "ERROR/EXCEPTION", false, undefined);
                        logger.error('[DVP-FIleService.infoByCategoryList] - [%s] - No data returned : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }

                }




            });
        }
        else
        {

            FileHandler.FilesWithCategoryListAndDateRange(req,Company,Tenant,startDateTime,endDateTime,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Error in searching Files With Category List And DateRange : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz.length);
                    logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Files found with category list and date range', reqId);
                    res.end(jsonString);
                }




            });

        }




    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.infoByCategoryList] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.post('/DVP/API/'+version+'/FileService/FileInfo/ByCategoryList/:rowCount/:pageNo',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{
    var reqId='';
    req.readable=true;

    var startDateTime='';
    var endDateTime='';


    if (req.query && req.query.startDateTime && req.query.endDateTime)
    {

        startDateTime=req.query["startDateTime"];
        endDateTime=req.query["endDateTime"];



    }


    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.infoByCategoryList] - [%s] - Invalid Authorization details found', reqId);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        if(!(startDateTime && endDateTime))
        {
            FileHandler.FilesWithCategoryList(req,Company,Tenant,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    if(resz)
                    {
                        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                        logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(new Error("No data returned"), "ERROR/EXCEPTION", false, undefined);
                        logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Request response : %s ', reqId, jsonString);
                        res.end(jsonString);
                    }

                }




            });
        }
        else
        {

            FileHandler.FilesWithCategoryListAndDateRange(req,Company,Tenant,startDateTime,endDateTime,reqId,function(err,resz)
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                    logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                    logger.debug('[DVP-FIleService.infoByCategoryList] - [%s] - Request response : %s ', reqId, jsonString);
                    res.end(jsonString);
                }




            });

        }




    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.infoByCategoryList] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});



RestServer.get('/DVP/API/'+version+'/FileService/FilesInfo/Category/:CategoryID/:rowCount/:pageNo',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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

        logger.info('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - [HTTP] - Request received - Inputs - Ref ID : %s  Class - %s Type - %s Category - %s',reqId,req.params.SessionID,req.params.Class,req.params.Type,req.params.Category);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.PickFilesWithCategoryID] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        FileHandler.AllFilesWithCategoryID(req.params.CategoryID,req.params.rowCount,req.params.pageNo,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - Error in Picking Files With CategoryID : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - Picking Files With CategoryID Succeeded ', reqId);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.PickFilesWithCategoryID] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/Files/:rowCount/:pageNo',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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
        var isVisibleCat=false;

        if(req.query.visibleSt)
        {
            isVisibleCat=req.query.visibleSt;
        }

        FileHandler.PickAllFilesWithPaging(req.params.rowCount,req.params.pageNo,Company,Tenant,isVisibleCat,reqId,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.AllFilesWithPaging] - [%s] - Error in Picking All Files With Paging : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                logger.debug('[DVP-FIleService.AllFilesWithPaging] - [%s] -  Files returned with paging ', reqId, jsonString);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.AllFilesWithPaging] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/File/Count/Category/:categoryID',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
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



        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.AllCats] - [%s] - Request response : %s ', reqId, jsonString);
            res.end(jsonString);
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

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

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.AllCats] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});


// Internal file service services

RestServer.get('/DVP/API/'+version+'/InternalFileService/File/Download/:tenant/:company/:id/:displayname',function(req,res,next)
{
    var reqId='';
    var userType ="Other";

    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        logger.info('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

        var Company=req.params.company;
        var Tenant=req.params.tenant;


        var fileObj =
            {
                id:req.params.id,
                option:option,
                Company:Company,
                Tenant:Tenant,
                userType:userType,
                reqId:reqId,
                method:"INTERNAL"
            }


        FileHandler.DownloadFileByID(res,fileObj);

    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [HTTP] - Exception in operation : %s ',reqId,jsonString);
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

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [HTTP] - Exception in operation: %s ',reqId,jsonString);
        res.status(400);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/InternalFileService/File/DownloadLatest/:tenant/:company/:filename',function(req,res,next)
{
    var reqId='';
    var userType ="Other";
    var category="";

    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }

        if (req.query && req.query.category)
        {

            category=req.query.category;

        }


        var Company=req.params.company;
        var Tenant=req.params.tenant;

        var fileObj =
            {
                FileName:req.params.filename,
                option:option,
                Company:Company,
                Tenant:Tenant,
                method:"DEFAULT",
                reqId:reqId,
                category:category


            }


        FileHandler.DownloadLatestFileByID(res,fileObj);

    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.InternalFileService.DownloadLatest] - [%s] - [HTTP] - Exception in operation : %s ',reqId,jsonString);
        res.status(404);
        res.end(jsonString);
    }

    return next();

});


RestServer.get('/DVP/API/'+version+'/InternalFileServiceLocal/File/DownloadLatest/:tenant/:company/:filename',function(req,res,next)
{
    var reqId='';
    var category="";

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

        if (req.query && req.query.category)
        {

            category=req.query.category;

        }


        var fileObj =
            {
                FileName:req.params.filename,
                option:option,
                Company:Company,
                Tenant:Tenant,
                method:"DEFAULT",
                reqId:reqId,
                category:category


            }


        FileHandler.DownloadLatestFileByID(res,fileObj);



    }
    catch(ex)
    {

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.InternalFileServiceLocal.DownloadLatest] - [%s] - [HTTP] - Exception in operation: %s ',reqId,jsonString);
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

        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.InternalFileService.DownloadLatest] - [%s] - [HTTP] - Error in operation : %s ',reqId,jsonString);
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
    logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - [HTTP] - Request Received',reqId);

    try {
        var Company = req.params.company;
        var Tenant = req.params.tenant;

        var prov = 1;

        var Clz = '';
        var Type = '';
        var Category = "";
        var ref = "tempRef";
        var resvID = "";
        var encripNeeded = false;
        req.readable = true;
        var FilePath = "";


        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        Type = file.type;


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

        if (req.query) {
            if (req.query.put_file) {
                FilePath = req.query.put_file;
            }

            if (req.query.class) {
                Clz = req.query.class;
            }
            if (req.query.type) {
                Type = req.query.type;
            }
            if (req.query.category) {
                Category = req.query.category;
            }
            if (req.query.sessionid) {
                ref = req.query.sessionid;
            }
            if (req.query.mediatype && req.query.filetype) {
                if (req.query.filetype == "wav" || req.query.filetype == "mp3") {
                    FileStructure = "audio/" + req.query.filetype;
                }
                else {
                    FileStructure = req.query.mediatype + "/" + req.query.filetype;
                }

            }
            if (req.query.sessionid && req.query.filetype) {
                FileName = req.query.sessionid + "." + req.query.filetype;
            }
            if (req.query.display) {
                DisplayName = req.query.display;
            }


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
            if (req.body.display) {
                file.display = req.body.display;

            }
            if (req.body.filename) {
                file.name = req.body.filename;
            }


            if (req.body.mediatype && req.body.filetype) {
                if (req.body.filetype == "wav" || req.body.filetype == "mp3") {
                    file.type = "audio/" + req.body.filetype;

                }
                else {
                    file.type = req.body.mediatype + "/" + req.body.filetype;

                }

            }


        }


        var ValObj = {

            "tenent": Tenant,
            "company": Company,
            "filename": file.name,
            "type": file.type,
            "id": rand2

        };

        var AttchVal = JSON.stringify(ValObj);


        logger.info('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s', reqId, AttchVal);


        var fileObj =
            {
                Fobj: file,
                rand2: rand2,
                cmp: Company,
                ten: Tenant,
                ref: ref,
                option: option,
                Clz: Clz,
                Type: Type,
                Category: Category,
                resvID: resvID,
                reqId: reqId

            }

        DeveloperFileUpoladManager.DeveloperUploadFiles(fileObj, function (errz, respg, tempPath) {

            if (tempPath) {
                fs.unlink(path.join(tempPath), function (errUnlink) {

                    if (errUnlink) {
                        console.log("Error status Removing Temp file", errUnlink);
                    }
                    else {
                        console.log("Temp file removed successfully");
                    }


                });
            }


            if (errz) {
                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Error ', reqId);
                res.end(jsonString);
            }

            else {


                logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s', reqId, JSON.stringify(respg), AttchVal);
                RedisPublisher.RedisPublish(respg, AttchVal, reqId, function (errRDS, resRDS) {
                        if (errRDS) {
                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                            logger.error('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                            res.end(jsonString);


                        }
                        else {
                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, rand2);
                            logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                            res.end(jsonString);

                        }


                    }
                );


            }


        });
    } catch (e) {
        var jsonString = messageFormatter.FormatMessage(e, "ERROR/EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
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
    logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - [HTTP] - Request Received',reqId);


    try {
        var Company = req.params.company;
        var Tenant = req.params.tenant;

        var prov = 1;

        var Clz = '';
        var Type = '';
        var Category = "";
        var ref = "tempRef";
        var resvID = "";
        var encripNeeded = false;
        req.readable = true;
        var FilePath = "";


        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        Type = file.type;


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

        if (req.query) {
            if (req.query.put_file) {
                FilePath = req.query.put_file;
            }

            if (req.query.class) {
                Clz = req.query.class;
            }
            if (req.query.type) {
                Type = req.query.type;
            }
            if (req.query.category) {
                Category = req.query.category;
            }
            if (req.query.sessionid) {
                ref = req.query.sessionid;
            }
            if (req.query.mediatype && req.query.filetype) {
                if (req.query.filetype == "wav" || req.query.filetype == "mp3") {
                    FileStructure = "audio/" + req.query.filetype;
                }
                else {
                    FileStructure = req.query.mediatype + "/" + req.query.filetype;
                }

            }
            if (req.query.sessionid && req.query.filetype) {
                FileName = req.query.sessionid + "." + req.query.filetype;
            }
            if (req.query.display) {
                DisplayName = req.query.display;
            }


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
            if (req.body.display) {
                file.display = req.body.display;

            }
            if (req.body.filename) {
                file.name = req.body.filename;
            }


            if (req.body.mediatype && req.body.filetype) {
                if (req.body.filetype == "wav" || req.body.filetype == "mp3") {
                    file.type = "audio/" + req.body.filetype;

                }
                else {
                    file.type = req.body.mediatype + "/" + req.body.filetype;

                }

            }


        }


        var ValObj = {

            "tenent": Tenant,
            "company": Company,
            "filename": file.name,
            "type": file.type,
            "id": rand2

        };

        var AttchVal = JSON.stringify(ValObj);


        logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s', reqId, AttchVal);


        var fileObj =
            {
                Fobj: file,
                rand2: rand2,
                cmp: Company,
                ten: Tenant,
                ref: ref,
                option: option,
                Clz: Clz,
                Type: Type,
                Category: Category,
                resvID: resvID,
                reqId: reqId

            }

        DeveloperFileUpoladManager.DeveloperUploadFiles(fileObj, function (errz, respg, tempPath) {

            if (tempPath) {
                fs.unlink(path.join(tempPath), function (errUnlink) {

                    if (errUnlink) {
                        console.log("Error status Removing Temp file", errUnlink);
                    }
                    else {
                        console.log("Temp file removed successfully");
                    }


                });
            }


            if (errz) {
                var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }

            else {


                logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - To publishing on redis - ServerID  %s Attachment values : %s', reqId, JSON.stringify(respg), AttchVal);
                RedisPublisher.RedisPublish(respg, AttchVal, reqId, function (errRDS, resRDS) {
                        if (errRDS) {
                            var jsonString = messageFormatter.FormatMessage(errRDS, "ERROR/EXCEPTION", false, undefined);
                            logger.error('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                            res.end(jsonString);


                        }
                        else {
                            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, rand2);
                            logger.debug('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] - Request response : %s ', reqId, jsonString);
                            res.end(jsonString);

                        }


                    }
                );


            }


        });
    } catch (e) {
        var jsonString = messageFormatter.FormatMessage(e, "ERROR/EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.InternalFileService.UploadFiles] - [%s] -Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
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

    logger.debug('[DVP-FIleService.InternalFileService.DownloadThumbnailByID] - [%s] - [HTTP] - Request received - Inputs - File ID : %s ',reqId,req.params.id);

    try {
        var Company = req.params.company;
        var Tenant = req.params.tenant;

        if (req.params.sz) {
            thumbSize = req.params.sz;
        }


        var fileObj =
            {
                UUID: req.params.id,
                option: option,
                Company: Company,
                Tenant: Tenant,
                reqId: reqId,
                method: "INTERNAL",
                thumbSize: thumbSize

            }

        InternalFileHandler.DownloadThumbnailByID(res, fileObj);
    } catch (e) {

        logger.error('[DVP-FIleService.InternalFileService.DownloadThumbnailByID] - [%s] - [HTTP] - Exception occurred when starting DownloadThumbnailByID service',reqId);
        var jsonString = messageFormatter.FormatMessage(e, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.InternalFileService.DownloadThumbnailByID] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }


    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/FileStorage/Category/:fileCategory',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{ var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }



        logger.debug('[DVP-FIleService.getFileStorageRecordByCategory] - [%s] - [HTTP] - Request received - ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-FIleService.getFileStorageRecordByCategory] - [%s] - Invalid Authorization details found ', reqId);
            res.end(jsonString);
        }



        var Company=req.user.company;
        var Tenant=req.user.tenant;
        var fileCategory = req.params.fileCategory;


        RedisPublisher.getFileStorageRecordByCategory(fileCategory,Company,Tenant, function (errData,resData) {

            if(errData)
            {
                var jsonString = messageFormatter.FormatMessage(errData, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.getFileStorageRecordByCategory] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resData);
                logger.debug('[DVP-FIleService.getFileStorageRecordByCategory] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.getFileStorageRecordByCategory] - [%s] - [HTTP] - Exception occurred when starting getFileStorageRecordByCategory service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.getFileStorageRecordByCategory] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/TotalUsedStorage',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"fileservice", action:"read"}),function(req,res,next)
{ var reqId='';
    try {

        try
        {
            reqId = uuid.v1();
        }
        catch(ex)
        {

        }



        logger.debug('[DVP-FIleService.getTotalFileStorageDetails] - [%s] - [HTTP] - Request received - ',reqId);

        if(!req.user.company || !req.user.tenant)
        {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-FIleService.getAllFileStorageRecords] - [%s] -Invalid Authorization details found  ', reqId);
            res.end(jsonString);
        }



        var Company=req.user.company;
        var Tenant=req.user.tenant;



        RedisPublisher.getTotalFileStorageDetails(Company,Tenant, function (errData,resData) {

            if(errData)
            {
                var jsonString = messageFormatter.FormatMessage(errData, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.getAllFileStorageRecords] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resData);
                logger.debug('[DVP-FIleService.getAllFileStorageRecords] - [%s] - Request response : %s ', reqId, jsonString);
                res.end(jsonString);
            }
        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.getAllFileStorageRecords] - [%s] - [HTTP] - Exception occurred when starting getFileStorageRecordByCategory service',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.getAllFileStorageRecords] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});


// .................................... Agent file upload ..................................................

RestServer.post('/DVP/API/'+version+'/FileService/Agent/FileUpload',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"myUserProfile", action:"write"}),function(req,res,next)
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
        logger.error('[DVP-APPRegistry.UploadFiles] - [%s] - Invalid Authorization details found', reqId);
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
    var encripNeeded=false;

    var upldFileKey = Object.keys(req.files)[0];
    var attachedFile = req.files[upldFileKey];
    var tPath = req.files[upldFileKey].path;

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


        if(Category && Category=="AGENT_GREETINGS")
        {
            logger.debug('[DVP-FIleService.AgentUploadFiles] - [%s] - [HTTP] - Request received - Inputs - Provision : %s Company : %s Tenant : %s',reqId,prov,Company,Tenant);

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


            logger.info('[DVP-FIleService.AgentUploadFiles] - [%s] - [FILEUPLOAD] - File path %s ',reqId,file.path);


            var ValObj={

                "tenent":Tenant,
                "company":Company,
                "filename":file.name,
                "type":file.type,
                "id":rand2

            };

            var AttchVal=JSON.stringify(ValObj);

            var fileObj =
                {
                    Fobj:file,
                    rand2:rand2,
                    cmp:Company,
                    ten:Tenant,
                    ref:ref,
                    option:option,
                    Clz:Clz,
                    Type:Type,
                    Category:Category,
                    resvID:resvID,
                    reqId:reqId

                }


            logger.debug('[DVP-FIleService.AgentUploadFiles] - [%s] - [FILEUPLOAD] - Attachment values %s',reqId,AttchVal);

            DeveloperFileUpoladManager.DeveloperUploadFiles(fileObj,function (errz, respg,tempPath) {

                fs.unlink(path.join(tempPath),function (errUnlink) {

                    if(errUnlink)
                    {
                        console.log("Error status Removing Temp file",errUnlink);
                    }
                    else
                    {
                        console.log("Temp file removed successfully");
                    }


                });
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
        else
        {
            fs.unlink(path.join(tPath),function (errUnlink) {

                if(errUnlink)
                {
                    console.log("Error status Removing Temp file",errUnlink);
                }
                else
                {
                    console.log("Temp file removed successfully");
                }


            });

            var jsonString = messageFormatter.FormatMessage(errz, "ERROR/EXCEPTION", false, undefined);
            logger.debug('[DVP-FIleService.AgentUploadFiles] - [%s] - UnAuthorized file category found : %s ', reqId,Category, jsonString);
            res.end(jsonString);
        }



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.UploadFiles] - [%s] - [HTTP] - Exception occurred when Developer file upload request starts  ',reqId);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.UploadFiles] - [%s] - Exception in operation : %s ', reqId, jsonString);
        var unlkPath="";

        if(attachedFile.tempPath)
        {
            unlkPath=attachedFile.tempPath;
        }
        else
        {
            unlkPath=tPath;
        }


        fs.unlink(path.join(unlkPath),function (errUnlink) {

            if(errUnlink)
            {
                console.log("Error status Removing Temp file",errUnlink);
            }
            else
            {
                console.log("Temp file removed successfully");
            }


        });

        res.end(jsonString);
    }
    return next();
});

RestServer.get('/DVP/API/'+version+'/FileService/Agent/FileDownload/:filename',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"myUserProfile", action:"read"}),function(req,res,next)
{
    var reqId='';
    var userType="Agent";
    var category="";

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File Name : %s ',reqId,req.params.filename);

    try {
        if (!req.user.company || !req.user.tenant) {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.DownloadFile] - [%s] -Invalid Authorization details found ', reqId);
            res.end(jsonString);
        }

        if (req.query && req.query.category)
        {

            category=req.query.category;

        }

        var Company = req.user.company;
        var Tenant = req.user.tenant;


        var fileObj =
            {
                FileName: req.params.filename,
                option: option,
                Company: Company,
                Tenant: Tenant,
                userType: userType,
                reqId: reqId,
                method: "DEFAULT",
                category:category
            }


        FileHandler.DownloadLatestFileByID(res, fileObj);

    } catch (e) {

        var jsonString = messageFormatter.FormatMessage(e, "ERROR/EXCEPTION", false, undefined);
        logger.error('[DVP-APPRegistry.DownloadFile] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

RestServer.get('/DVP/API/'+version+'/FileService/FileRecords/:size/:page',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"myUserProfile", action:"read"}),function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [HTTP] - Request received - Inputs - File Name : %s ',reqId,req.params.filename);

    try {
        if (!req.user.company || !req.user.tenant) {
            var jsonString = messageFormatter.FormatMessage(new Error("Invalid Authorization details found "), "ERROR/EXCEPTION", false, undefined);
            logger.error('[DVP-APPRegistry.DownloadFile] - [%s] - Invalid Authorization details found ', reqId);
            res.end(jsonString);
        }

        var Company = req.user.company;
        var Tenant = req.user.tenant;


        FileHandler.GetFileDetails(res, req.params.filename, option, Company, Tenant, reqId, function (errDownFile, resDownFile) {
            if (errDownFile) {
                var jsonString = messageFormatter.FormatMessage(errDownFile, "ERROR/EXCEPTION", false, undefined);
                logger.error('[DVP-FIleService.DownloadFile] - [%s] - Error in searching file details : %s ', reqId, jsonString);


            }
            else {
                var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resDownFile);
                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - File details found ', reqId);


            }

        });
    } catch (e) {
        var jsonString = messageFormatter.FormatMessage(e, "ERROR/EXCEPTION", false, undefined);
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - Exception in operation : %s ', reqId, jsonString);
        res.end(jsonString);
    }





    return next();

});

RestServer.put('/DVP/API/'+version+'/FileService/FileInfo/:id/path',jwt({secret: secret.Secret,getToken: GetToken}),authorization({resource:"myUserProfile", action:"read"}),FileHandler.updateFilePath);


RestServer.get('DVP/API/Test',function (req,res,next) {

    var person =
        {
            "person":[
                {
                    "name":"John",
                    "age":"23"

                },
                {
                    "name":"Sansa",
                    "age":"18"
                },
                {
                    "name":"Arya",
                    "age":"16"
                }
            ]
        }


    res.end(JSON.stringify(person));
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




