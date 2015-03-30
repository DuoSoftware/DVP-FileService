/**
 * Created by pawan on 2/23/2015.
 */

var restify = require('restify');
//var sre = require('swagger-restify-express');

var FileHandler=require('./FileHandlerApi.js');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var CallServerChooser=require('./CallServerChooser.js');
var RedisPublisher=require('./RedisPublisher.js');
var uuid = require('node-uuid');





var RestServer = restify.createServer({
    name: "myapp",
    version: '1.0.0'
},function(req,res)
{

});
//Server listen
RestServer.listen(8081, function () {
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

//callback Done.......................................................................................................................

RestServer.post('/DVP/API/:version/FIleService/FileHandler/UploadFile/:cmp/:ten',function(req,res,next)
{


    try {

        var rand2 = uuid.v4().toString();
        var fileKey = Object.keys(req.files)[0];
        var file = req.files[fileKey];
        console.log(file.path);

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
        console.log(AttchVal);




        try {
            CallServerChooser.ProfileTypeCallserverChooser(req.params.cmp,req.params.ten,function(err,resz)
            {
                if(resz)
                {
                    FileHandler.SaveUploadFileDetails(req.params.cmp,req.params.ten,file,rand2,function(errz,respg)
                    {
                        if(respg) {


                            RedisPublisher.RedisPublish(resz,AttchVal,function(errRDS,resRDS)
                                {
                                    if(errRDS)
                                    {
                                        // var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resRDS);
                                        res.end(resRDS);

                                    }
                                    else
                                    {
                                        //var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS redis", true, resRDS);
                                        res.end(resRDS);

                                    }

                                    resRDS.end();
                                }

                            );


                        }

                        else if(errz)
                        {
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, respg);

                        }

                        //respg.end();
                    });

                }
                else if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                    res.end(jsonString);

                }

//resz.end();
            });



        }
        catch(ex)
        {
            var jsonString = messageFormatter.FormatMessage(ex, "GetMaxLimit failed", false, res);
            res.end(jsonString);
        }





    }
    catch(ex)
    {
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

//callback done.......................................get.............................................................................

RestServer.get('/DVP/API/:version/FIleService/FileHandler/DownloadFile/:id',function(req,res,next)
{
    try {

        FileHandler.DownloadFileByID(res,req.params.id,function(err,resz)
        {
            if(err)
            {
                //var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION Download", false, resz);
                // console.log(err);
                res.end("Error Returns");
            }
            else if(resz)
            {
                // var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, resz);
                //res.end();
                console.log("Done");
            }

        });



    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, res);
        res.end(jsonString);
    }

    return next();

});

//callback done.
RestServer.get('/DVP/API/:version/FIleService/FileHandler/GetAttachmentMetaData/:id',function(req,res,next)
{
    try {

        FileHandler.GetAttachmentMetaDataByID(req.params.id,function(err,resz)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/EXCEPTION", false, resz);
                res.end(jsonString);
            }
            else if(resz)
            {
                var jsonString = messageFormatter.FormatMessage(null, "SUCCESS", true, resz);
                res.end(jsonString);
            }




        });



    }
    catch(ex)
    {
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