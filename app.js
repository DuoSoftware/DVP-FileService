/**
 * Created by pawan on 2/23/2015.
 */

var restify = require('restify');
//var sre = require('swagger-restify-express');

var FileHandler=require('./FileHandlerApi.js');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var CallServerChooser=require('./CallServerChooser.js');
var RedisPublisher=require('./RedisPublisher.js');
var DeveloperFileUpoladManager=require('./DeveloperFileUpoladManager.js');
var uuid = require('node-uuid');
var log4js=require('log4js');

var config = require('config');

var port = config.Host.port || 3000;

var version=config.Host.version;


log4js.configure('./config/log4js_config.json', { cwd: './logs' });
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
RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/UploadFile/:cmp/:ten/:prov',function(req,res,next)
{
// instance 1,
    // profile 2,
    //shared 3

    try {
        log.info("\n.............................................File Uploding Starts....................................................\n");
        log.info("Upload params  :- ComapnyId : "+req.params.cmp+" TenentId : "+req.params.ten+" Provision : "+req.params.prov);

        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        //console.log(file.path);
        log.info("File path : "+file.path);

        var DisplyArr = file.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];

        var ValObj={

            "tenent":req.params.ten,
            "company":req.params.cmp,
            "filename":file.name,
            "type":file.type,
            "id":rand2
        }

        var AttchVal=JSON.stringify(ValObj);
        //console.log(AttchVal);

        log.info("Attachment Values : "+AttchVal);

        var ProvTyp=req.params.prov;



        if(ProvTyp==1) {
            try {
                CallServerChooser.InstanceTypeCallserverChooser(req.params.cmp, req.params.ten, function (err, resz) {

                    log.info("Instance type is selected : "+ProvTyp);
                    if (resz) {



                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2, function (errz, respg) {
                            if (respg) {


                                log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                RedisPublisher.RedisPublish(resz, AttchVal, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                            log.error("Error occurred in publishing to redis   : "+errRDS);
                                            res.end(errRDS);



                                        }
                                        else {
                                            //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                            log.info("Successfully published to redis "+resRDS);
                                            res.end(resRDS);




                                        }


                                    }
                                );


                            }

                            else if (errz) {

                                log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, respg);
                                res.end(jsonString);
                            }

                            //respg.end();
                        });

                    }
                    else if (err) {

                        log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                var jsonString = messageFormatter.FormatMessage(ex, "GetMaxLimit failed", false, res);
                res.end(jsonString);
            }


        }

        else if(ProvTyp==2)
        {
            try {
                log.info("Profile type is selected : "+ProvTyp);
                CallServerChooser.ProfileTypeCallserverChooser(req.params.cmp, req.params.ten, function (err, resz) {
                    if (resz) {


                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2, function (errz, respg) {
                            if (respg) {

                                log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                RedisPublisher.RedisPublish(resz, AttchVal, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            log.error("Error occurred in publishing to redis   : "+errRDS);
                                            // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                            res.end(resRDS);

                                        }
                                        else {
                                            log.info("Successfully published to redis "+resRDS);
                                            //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                            res.end(resRDS);

                                        }

                                    }
                                );


                            }

                            else if (errz) {
                                log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, respg);
                                res.end(jsonString);

                            }

                            //respg.end();
                        });

                    }
                    else if (err) {
                        log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                var jsonString = messageFormatter.FormatMessage(ex, "GetMaxLimit failed", false, res);
                res.end(jsonString);
            }
        }




        else
        {
            try {
                log.info("Shared type is selected : "+ProvTyp);
                CallServerChooser.SharedTypeCallsereverChooser(req.params.cmp, req.params.ten, function (err, resz) {

                    if (resz) {


                        FileHandler.SaveUploadFileDetails(req.params.cmp, req.params.ten, file, rand2, function (errz, respg) {
                            if (respg) {

                                log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                RedisPublisher.SharedServerRedisUpdate(resz,AttchVal);
                                res.end('Done');



                            }

                            else if (errz) {
                                log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, respg);
                                res.end(jsonString);
                            }

                            //respg.end();
                        });

                    }
                    else if (err) {
                        log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                var jsonString = messageFormatter.FormatMessage(ex, "GetMaxLimit failed", false, res);
                res.end(jsonString);
            }
        }

    }
    catch(ex)
    {
        log.fatal("Exception occurred when calling upload function   : "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Upload failed", false, res);
        // res.end(jsonString);
        var jsonString = messageFormatter.FormatMessage(ex, "Upload not succeeded:exception found", false, null);
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

RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/DevUploadFile/:cmp/:ten/:prov',function(req,res,next)
{
    try {
        // log.info("\n.............................................File Uploding Starts....................................................\n");
        //log.info("Upload params  :- ComapnyId : "+req.params.cmp+" TenentId : "+req.params.ten+" Provision : "+req.params.prov);

        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        //console.log(file.path);
        log.info("File path : "+file.path);

        var DisplyArr = file.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];

        var ValObj={

            "tenent":req.params.ten,
            "company":req.params.cmp,
            "filename":file.name,
            "type":file.type,
            "id":rand2
        }

        var AttchVal=JSON.stringify(ValObj);
        //console.log(AttchVal);

        log.info("Attachment Values : "+AttchVal);

        var ProvTyp=req.params.prov;



        if(ProvTyp==1) {
            try {
                CallServerChooser.InstanceTypeCallserverChooser(req.params.cmp, req.params.ten, function (err, resz) {

                    log.info("Instance type is selected : "+ProvTyp);
                    if (resz) {



                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten,function (errz, respg) {
                            if (respg) {


                                log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                /*
                                 RedisPublisher.RedisPublish(resz, AttchVal, function (errRDS, resRDS) {
                                 if (errRDS) {
                                 // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                 log.error("Error occurred in publishing to redis   : "+errRDS);
                                 res.end(errRDS);



                                 }
                                 else {
                                 //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                 log.info("Successfully published to redis "+resRDS);
                                 res.end(resRDS);




                                 }


                                 }
                                 );
                                 */
                                res.end();

                            }

                            else if (errz) {

                                log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, respg);
                                res.end(errz.toString());
                            }

                            //respg.end();
                        });

                    }
                    else if (err) {

                        log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                        res.end(err);

                    }

//resz.end();
                });


            }
            catch (ex) {
                log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                var jsonString = messageFormatter.FormatMessage(ex, "GetMaxLimit failed", false, res);
                res.end(ex);
            }


        }

        else if(ProvTyp==2)
        {
            try {
                log.info("Profile type is selected : "+ProvTyp);
                CallServerChooser.ProfileTypeCallserverChooser(req.params.cmp, req.params.ten, function (err, resz) {
                    if (resz) {


                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten, function (errz, respg) {
                            if (respg) {

                                log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                RedisPublisher.RedisPublish(resz, AttchVal, function (errRDS, resRDS) {
                                        if (errRDS) {
                                            log.error("Error occurred in publishing to redis   : "+errRDS);
                                            // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                            res.end(resRDS);

                                        }
                                        else {
                                            log.info("Successfully published to redis "+resRDS);
                                            //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                            res.end(resRDS);

                                        }

                                    }
                                );


                            }

                            else if (errz) {
                                log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, respg);
                                res.end(jsonString);

                            }

                            //respg.end();
                        });

                    }
                    else if (err) {
                        log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                var jsonString = messageFormatter.FormatMessage(ex, "GetMaxLimit failed", false, res);
                res.end(jsonString);
            }
        }




        else
        {
            try {
                log.info("Shared type is selected : "+ProvTyp);
                CallServerChooser.SharedTypeCallsereverChooser(req.params.cmp, req.params.ten, function (err, resz) {

                    if (resz) {


                        DeveloperFileUpoladManager.DeveloperUploadFiles(file,rand2,req.params.cmp, req.params.ten, function (errz, respg) {
                            if (respg) {

                                log.info("To redis publish :- ServerID :  "+JSON.stringify(resz)+" Attachment values : "+AttchVal);
                                RedisPublisher.SharedServerRedisUpdate(resz,AttchVal);
                                res.end('Done');



                            }

                            else if (errz) {
                                log.error("Error occurred in saving uploaded file details to Database   : "+errz);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, respg);
                                res.end(jsonString);
                            }

                            //respg.end();
                        });

                    }
                    else if (err) {
                        log.error("Error occurred in searching suitable call server   : "+err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                        res.end(jsonString);

                    }

//resz.end();
                });


            }
            catch (ex) {
                log.fatal("Exception occurred when entering to CallServerChooser method   : "+ex);
                var jsonString = messageFormatter.FormatMessage(ex, "GetMaxLimit failed", false, res);
                res.end(jsonString);
            }
        }

    }
    catch(ex)
    {
        log.fatal("Exception occurred when calling upload function   : "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Upload failed", false, res);
        // res.end(jsonString);
        var jsonString = messageFormatter.FormatMessage(ex, "Upload not succeeded:exception found", false, null);
        res.end(jsonString);
    }
    return next();
});
RestServer.post('/DVP/API/'+version+'/FIleService/FileHandler/FileAssignToApp',function(req,res,next)
{
    try {
        // log.info("\n.............................................File Uploding Starts....................................................\n");
        //log.info("Upload params  :- ComapnyId : "+req.params.cmp+" TenentId : "+req.params.ten+" Provision : "+req.params.prov);


        DeveloperFileUpoladManager.UploadAssignToApplication(req.body,function(err,resz)
        {
            if(err)
            {
                console.log(err);
                res.end();
            }
            else
            {
                console.log(resz);
                res.end();
            }
        });



    }
    catch(ex) {
        res.end(ex);
    }
    return next();
});
RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/GetVoiceAppClipsByName/:Filename/:AppName/:TenantId/:CompanyId',function(req,res,next)
{
    try {
        // log.info("\n.............................................File Uploding Starts....................................................\n");
        //log.info("Upload params  :- ComapnyId : "+req.params.cmp+" TenentId : "+req.params.ten+" Provision : "+req.params.prov);


    FileHandler.GetVoiceClipIdbyName(req.params.Filename,req.params.AppName,req.params.TenantId,req.params.CompanyId, function (err, resz) {
        if (err) {
            console.log(err);
            res.end();
        }
        else {
            console.log(resz);
            res.end();
        }
    });

}


    catch(ex) {
        res.end(ex);
    }
    return next();
});




//callback done.......................................get.............................................................................
//Log Done...............................................................................................................
RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/DownloadFile/:id',function(req,res,next)
{
    log.info("\n.............................................File Downloading Starts....................................................\n");
    try {
        log.info("File ID : "+req.params.id);
        FileHandler.DownloadFileByID(res,req.params.id,function(err,resz)
        {
            if(err)
            {
                //var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION Download", false, resz);
                // console.log(err);
                log.error("Error in downloading : "+err);
                res.end("Error Returns");
            }
            else if(resz)
            {
                // var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                //res.end();
                log.info("Successfully Downloaded.Result : "+resz);
                console.log("Done");
            }

        });



    }
    catch(ex)
    {
        log.fatal("Exception found  in downloading : "+ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, res);
        res.end(jsonString);
    }

    return next();

});

//callback done.
//Log Done...............................................................................................................
RestServer.get('/DVP/API/'+version+'/FIleService/FileHandler/GetAttachmentMetaData/:id',function(req,res,next)
{
    log.info("\n.............................................Getting Attachment meta data Starts....................................................\n");
    try {

        FileHandler.GetAttachmentMetaDataByID(req.params.id,function(err,resz)
        {
            if(err)
            {
                log.error("error found  in searching : "+err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                res.end(jsonString);
            }
            else if(resz)
            {
                log.info("Successfully Downloaded.Result : "+resz);
                var jsonString = messageFormatter.FormatMessage(null, "SUCCESS", true, resz);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
        log.fatal("Exception found  in downloading : "+ex);
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, res);
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