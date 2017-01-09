/**
 * Created by pawan on 4/9/2015.
 */
//.....................................................................................................
// change mongodb module to mongoose
//.....................................................................................................

var DbConn = require('dvp-dbmodels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var fs=require('fs');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var config = require('config');
// sprint 5

var couchbase = require('couchbase');
var Cbucket=config.Couch.bucket;
var CHip=config.Couch.ip;
var cluster = new couchbase.Cluster("couchbase://"+CHip);

//


var fs=require('fs');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var easyimg = require('easyimage');


var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    assert = require('assert');



var MIP=config.Mongo.ip;
var MPORT=config.Mongo.port;
var MDB=config.Mongo.dbname;

var mongodb = require('mongodb');
var gm = require('gm').subClass({imageMagick: true});
var async= require('async');


function FindCurrentVersion(fname,company,tenant,reqId,callback)
{
    try
    {
        logger.debug('[DVP-FIleService.FindCurrentVersion.FindCurrentVersion] - [%s] - Searching for current version of %s',reqId,fname);
        DbConn.FileUpload.max('Version',{where: [{Filename: fname},{CompanyId:company},{TenantId:tenant}]}).then(function (resFile) {

            if(resFile)
            {
                logger.debug('[DVP-FIleService.FindCurrentVersion.FindCurrentVersion] - [%s] - [PGSQL] - Old version of % is found and New version will be %d',reqId,fname,parseInt((resFile)+1));
                callback(undefined,parseInt((resFile)+1));
            }
            else
            {
                if(resFile<0)
                {
                    logger.debug('[DVP-FIleService.FindCurrentVersion.FindCurrentVersion] - [%s] - [PGSQL] -  Reserved file found',reqId,fname);
                    callback(undefined,0);
                }
                else
                {
                    logger.debug('[DVP-FIleService.FindCurrentVersion.FindCurrentVersion] - [%s] - [PGSQL] -  Version of %s is not found and New version will be 1',reqId,fname);
                    callback(undefined,1);
                }

            }

        }).catch(function (errFile) {

            logger.error('[DVP-FIleService.FindCurrentVersion.FindCurrentVersion] - [%s] - [PGSQL] - Error occurred while searching for current version of %s',reqId,fname,errFile);
            callback(errFile,undefined);

        });

    }
    catch (ex)
    {
        logger.error('[DVP-FIleService.FindCurrentVersion.FindCurrentVersion] - [%s] - Exception occurred when start searching current version of %s',reqId,FObj.name,ex);
        callback(ex,undefined);
    }
}

/*function DeveloperUploadFiles(Fobj,rand2,cmp,ten,ref,option,Clz,Type,Category,reqId,callback)
 {

 try
 {
 var DisplyArr = Fobj.path.split('\\');

 var DisplayName=DisplyArr[DisplyArr.length-1];
 }
 catch(ex)
 {
 logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred while creating DisplayName %s',reqId,JSON.stringify(Fobj));
 callback(ex,undefined);
 }

 try
 {

 FindCurrentVersion(Fobj,cmp,ten,reqId,function(err,result)
 {
 if(err)
 {
 callback(err,undefined);
 }
 else
 {
 try
 {
 var NewUploadObj = DbConn.FileUpload
 .build(
 {
 UniqueId: rand2,
 FileStructure: Fobj.type,
 ObjClass: Clz,
 ObjType: Type,
 ObjCategory: Category,
 URL: Fobj.path,
 UploadTimestamp: Date.now(),
 Filename: Fobj.name,
 Version:result,
 DisplayName: DisplayName,
 CompanyId:cmp,
 TenantId: ten,
 RefId:ref


 }
 );
 logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - New attachment object %s',reqId,JSON.stringify(NewUploadObj));
 NewUploadObj.save().then(function (resUpFile) {

 logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s successfully inserted',reqId,JSON.stringify(NewUploadObj));

 DbConn.FileCategory.find({where:{Category:Category}}).then(function (resCat) {

 resUpFile.setFileCategory(resCat.id).then(function (resCatset) {

 console.log("Category attached successfully");

 }).catch(function (errCatSet) {
 console.log("Error in category attaching "+errCatSet);
 });

 }).catch(function (errCat) {
 console.log("Error in searching file categories "+errCat);
 });

 if(option=="LOCAL")
 {
 logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s successfully inserted to Local',reqId,JSON.stringify(NewUploadObj));
 callback(undefined, resUpFile.UniqueId);
 }
 else if(option=="MONGO")
 {
 logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment object %s on process of uploading to MongoDB',reqId,JSON.stringify(NewUploadObj));
 console.log("TO MONGO >>>>>>>>> "+rand2);
 MongoUploader(rand2,Fobj.path,reqId,function(errMongo,resMongo)
 {
 if(errMongo)
 {
 console.log(errMongo);
 callback(errMongo,undefined);
 }else
 {
 console.log(resMongo);
 callback(undefined,resUpFile.UniqueId);
 }

 });
 }
 // sprint 5
 else if(option=="COUCH")
 {
 logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment object %s on process of uploading to COUCH',reqId,JSON.stringify(NewUploadObj));
 console.log("TOCOUCH >>>>>>>>> "+rand2);
 CouchUploader(rand2,Fobj,resUpFile,reqId,function(errCouch,resCouch)
 {
 if(errCouch)
 {
 console.log(errCouch);
 callback(errCouch,undefined);
 }
 else
 {
 console.log(resCouch);
 callback(undefined,resUpFile.UniqueId);
 }

 });

 }




 }).catch(function (errUpFile) {

 logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s insertion failed',reqId,JSON.stringify(NewUploadObj),errUpFile);
 callback(errUpFile, undefined);



 });

 }
 catch(ex)
 {
 logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred when new attachment object creating ',reqId,ex);
 callback(ex,undefined);
 }
 }
 });

 }
 catch(ex)
 {
 logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred when new attachment object saving starting ',reqId,ex);
 callback(ex,undefined);
 }






 }*/


function MongoUploader(uuid,Fobj,reqId,callback)
{
    var path=Fobj.path;
    var sizeArray=['75','100','125','150','200'];
    var thumbnailArray=[];

    var fileStruct=Fobj.type.split("/")[0];

    var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;
    mongodb.MongoClient.connect(uri, function(error, db)
    {
        console.log(uri);
        console.log("Error1 "+error);
        //console.log("db "+JSON.stringify(db));
        //assert.ifError(error);
        var bucket = new mongodb.GridFSBucket(db);
        var ThumbBucket = new mongodb.GridFSBucket(db,{ bucketName: 'thumbnails' });

        fs.createReadStream(path).
            pipe(bucket.openUploadStream(uuid)).
            on('error', function(error) {
                // assert.ifError(error);
                console.log("Error "+error);
                db.close();
                callback(error,undefined);
            }).
            on('finish', function() {
                console.log('done!');


                if(fileStruct=="image")
                {
                    sizeArray.forEach(function (size) {


                        thumbnailArray.push(function createContact(callbackThumb)
                        {

                            gm(fs.createReadStream(path)).resize(size, size).quality(50)
                                .stream(function (err, stdout, stderr) {
                                    var writeStream = ThumbBucket.openUploadStream(uuid + "_"+size);
                                    stdout.pipe(writeStream).on('error', function(error)
                                    {
                                        console.log("Error in making thumbnail "+uuid + "_"+size);
                                        callbackThumb(error,undefined);
                                    }). on('finish', function()
                                    {
                                        console.log("Making thumbnail "+uuid + "_"+size+" Success");
                                        callbackThumb(undefined,"Done");
                                    });
                                });
                        });
                    });

                    async.parallel(thumbnailArray, function (errThumbMake,resThumbMake) {

                        db.close();
                        callback(undefined,uuid);


                    });
                }
                else
                {
                    db.close();
                    callback(undefined,uuid);
                }


            });

    });

}


function CouchUploader(uuid,fobj,resUpFile,reqId,callback)
{

    var content;

    var bucket = cluster.openBucket(Cbucket);

    fs.readFile(fobj.path, function read(errRead, data) {
        if (errRead) {
            callback(errRead,undefined);
        }
        else
        {
            var options={
                FileStructure:fobj.FileStructure,
                Filename:fobj.Filename,
                Version:resUpFile.Version,
                DisplayName:resUpFile.DisplayName



            };
            content = data;
            bucket.upsert(uuid, content,options, function (errSave, resSave) {
                if (errSave) {

                    callback(errSave,undefined);
                    //callback(err,undefined);
                } else {
//console.log("Done");
                    callback(undefined,uuid);
                    //var dest = fs.createWriteStream('C:/Users/pawan/Desktop/dd.mp3');
                    //var s = streamifier.createReadStream(data);


                    //console.log(s);
                    //s.pipe(dest);



                    //callback(undefined,"Succesfully uploaded");
                }


                // Invoke the next step here however you like
                //console.log(content);   // Put all of the code here (not the best solution)
                // Or put the next step in a function and invoke it
            });
        }







    });






    //var dest = fs.createWriteStream('C:/Users/pawan/Desktop/dd');
    //var cluster = new couchbase.Cluster();
    //var bucket = cluster.openBucket('default');
    // var fl=strm.read();
    //console.log(strm);




    /*bucket.upsert('testdoc5', fl, function(err, result) {
     if (err) {console.log(err);}

     bucket.get('testdoc5', function(err, result) {
     if (err) {console.log(err);}

     console.log("W is "+JSON.stringify(result.value));
     // strm.pipe(dest);
     // {name: Frank}
     });
     });


     */



    /* bucket.get('testdoc3', function(err, result) {
     if (err) {
     console.log(err);
     }



     var source=result.value._readableState.buffer;
     console.log("S is "+JSON.stringify(source));



     var dest = fs.createWriteStream('C:/Users/pawan/Desktop/dd');
     //source.pipe(dest);
     var s=  streamifier.createReadStream(source.toString());
     console.log("stmfris "+JSON.stringify(s));
     s.pipe(dest);

     });*/


}




function UploadAssignToApplication(Fileuuid,AppId,version,reqId,callback)
{

    try
    {
        logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - Attaching file to application starts - Inputs - %s',reqId);
        /*
         DbConn.FileUpload.find({where: [{Filename: FObj.Filename},{Version:FObj.Version}]}).complete(function (err, CurFileObject)
         {
         if(err)
         {
         callback(err,undefined);
         }
         else
         {
         if(CurFileObject)
         {
         DbConn.Application.find({where: [{AppName: FObj.AppName}]}).complete(function (errz, CurAppObject)
         {
         if(err)
         {
         callback(errz,undefined);
         }
         else
         {/*
         CurAppObject.addFileUpload(CurFileObject).complete(function (errx, MapRes) {
         if (errx) {
         callback(errx, undefined);
         }
         else {
         callback(undefined, JSON.stringify(MapRes));
         }
         })


         }
         });
         }
         else
         {
         callback('No record',undefined);
         }
         }

         });

         */

        DbConn.FileUpload
            .findAll({where: [{UniqueId: Fileuuid},{ApplicationId: AppId}]})
            .then(function (resFile) {

                if(resFile)
                {
                    //console.log("Result length "+FileObj.length);
                    logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  %s Records found for uploaded file %s  with Application %s',reqId,resFile.length,Fileuuid,AppId,err);
                    logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Searching for Application %s',reqId,AppId);
                    try {
                        DbConn.Application.find({where: [{id: AppId}]}).then(function (resApp) {

                            if (resFile.length == 0) {
                                logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Only one file found %s',reqId,JSON.stringify(resFile));
                                try
                                {
                                    DbConn.FileUpload
                                        .find({where: [{UniqueId: Fileuuid}, {ObjType: 'Voice app clip'}, {Version: version}]})
                                        .complete(function (errFile, ResFile) {
                                            if (errFile) {
                                                //console.log("Error " + errFile);
                                                logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while searching for Uploaded file %s with object type : Voice app clip , version : %s   ',reqId,Fileuuid,version,err);
                                                callback(errFile, undefined);
                                            }
                                            else {
                                                try{
                                                    ResFile.setApplication(resApp).complete(function (errupdt, resupdt) {
                                                        if (errupdt) {
                                                            //console.log("Error " + errupdt);
                                                            logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while attaching uploaded file %s to application &s',reqId,ResFile,resApp,errupdt);
                                                            callback(errupdt, undefined);
                                                        }
                                                        else
                                                        {
                                                            logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Attaching uploaded file %s to application &s is succeeded',reqId,ResFile,resApp);
                                                            callback(undefined, "Done");
                                                        }
                                                    });
                                                }catch(ex)
                                                {
                                                    logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Exception occurred when attaching uploaded file to application method starts',reqId);
                                                    callback(ex,undefined);
                                                }
                                            }
                                        });
                                }
                                catch(ex)
                                {
                                    logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Exception occurred when Uploaded file searching starts',reqId);
                                    callback(ex,undefined);
                                }
                            }
                            else {
                                logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   %s of Uploaded files found :  %s',reqId,(resFile.length+1),JSON.stringify(resFile));
                                for (var index in resFile) {
                                    //console.log("Result length " + FileObj[index]);

                                    if (resFile[index].Version == version) {
                                        logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Version %s is already up to date of file % ',reqId,resFile[index].Version,resFile[index].Filename);
                                        callback(new Error("Already up to date"), undefined);
                                    }
                                    else {
                                        try
                                        {
                                            logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Make Files uploads to null of Application %s ',reqId,JSON.stringify(resApp));
                                            resApp.setFileUpload(null).then(function (resRem) {


                                                try{
                                                    DbConn.FileUpload
                                                        .find({where: [{UniqueId: Fileuuid},{ApplicationId: AppId}, {Version: version}]})
                                                        .then(function (ResFile) {

                                                            try{
                                                                logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(resApp));
                                                                ResFile.setApplication(resApp).then(function (resupdt) {

                                                                    logger.info('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s is succeeded ',reqId,JSON.stringify(ResFile),JSON.stringify(resApp));
                                                                    callback(undefined, resupdt);
                                                                }).catch(function (errupdt) {
                                                                    logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(resApp),errupdt);
                                                                    callback(errupdt, undefined);
                                                                });



                                                                /* complete(function (errupdt, resupdt) {
                                                                 if (errupdt) {
                                                                 //console.log("Error " + errupdt);
                                                                 logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(resApp),errupdt);
                                                                 callback(errupdt, undefined);
                                                                 }
                                                                 else {
                                                                 logger.info('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s is succeeded ',reqId,JSON.stringify(ResFile),JSON.stringify(resApp),errupdt);
                                                                 callback(undefined, "Done");
                                                                 }
                                                                 });*/
                                                            }
                                                            catch(ex)
                                                            {
                                                                logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when mapping Uploaded file with Application process starts',reqId,ex);
                                                                callback(ex,undefined);
                                                            }

                                                        }).catch(function (errFile) {
                                                            logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred while searching for Uploaded file %s',reqId,Fileuuid,errFile);
                                                            callback(errFile, undefined);
                                                        });
                                                    /*.complete(function (errFile, ResFile) {
                                                     if (errFile) {
                                                     logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred while searching for Uploaded file %s',reqId,Fileuuid,errFile);
                                                     callback(errFile, undefined);
                                                     }
                                                     else {
                                                     try{
                                                     logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(resApp));
                                                     ResFile.setApplication(resApp).complete(function (errupdt, resupdt) {
                                                     if (errupdt) {
                                                     //console.log("Error " + errupdt);
                                                     logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(resApp),errupdt);
                                                     callback(errupdt, undefined);
                                                     }
                                                     else {
                                                     logger.info('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s is succeeded ',reqId,JSON.stringify(ResFile),JSON.stringify(resApp),errupdt);
                                                     callback(undefined, "Done");
                                                     }
                                                     });
                                                     }
                                                     catch(ex)
                                                     {
                                                     logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when mapping Uploaded file with Application process starts',reqId,ex);
                                                     callback(ex,undefined);
                                                     }
                                                     }
                                                     });*/
                                                }
                                                catch (ex)
                                                {
                                                    logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when searching uploaded file records',reqId,ex);
                                                    callback(ex,undefined);
                                                }



                                            }).catch(function (errRem) {

                                                logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when Make Files uploads to null of Application %s',reqId,JSON.stringify(resApp),errRem);
                                                callback(errRem, undefined);

                                            });


                                            /*complete(function (errRem, resRem) {
                                             if (errRem) {
                                             logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when Make Files uploads to null of Application %s',reqId,JSON.stringify(resApp),errRem);
                                             callback(errRem, undefined);
                                             }
                                             else {
                                             //console.log(JSON.stringify(FileObj[index]) + " null");
                                             try{
                                             DbConn.FileUpload
                                             .find({where: [{UniqueId: Fileuuid},{ApplicationId: AppId}, {Version: version}]})
                                             .complete(function (errFile, ResFile) {
                                             if (errFile) {
                                             logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred while searching for Uploaded file %s',reqId,Fileuuid,errFile);
                                             callback(errFile, undefined);
                                             }
                                             else {
                                             try{
                                             logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(resApp));
                                             ResFile.setApplication(resApp).complete(function (errupdt, resupdt) {
                                             if (errupdt) {
                                             //console.log("Error " + errupdt);
                                             logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(resApp),errupdt);
                                             callback(errupdt, undefined);
                                             }
                                             else {
                                             logger.info('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s is succeeded ',reqId,JSON.stringify(ResFile),JSON.stringify(resApp),errupdt);
                                             callback(undefined, "Done");
                                             }
                                             });
                                             }
                                             catch(ex)
                                             {
                                             logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when mapping Uploaded file with Application process starts',reqId,ex);
                                             callback(ex,undefined);
                                             }
                                             }
                                             });
                                             }
                                             catch (ex)
                                             {
                                             logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when searching uploaded file records',reqId,ex);
                                             callback(ex,undefined);
                                             }
                                             }

                                             });*/
                                        }
                                        catch (ex)
                                        {
                                            logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when detach Uploaded files from Application',reqId,ex);
                                            callback(ex,undefined);
                                        }
                                    }
                                }
                            }

                        }).catch(function (errApp) {

                            logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while searching for application %s  ',reqId,AppId,err);
                            callback(errApp, undefined);

                        });



                        /*complete(function (errz, AppObj) {

                         if (errz) {
                         //console.log("Err " + errz);
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while searching for application %s  ',reqId,AppId,err);
                         callback(errz, undefined);
                         }
                         else {
                         if (resFile.length == 0) {
                         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Only one file found %s',reqId,JSON.stringify(resFile));
                         try
                         {
                         DbConn.FileUpload
                         .find({where: [{UniqueId: Fileuuid}, {ObjType: 'Voice app clip'}, {Version: version}]})
                         .complete(function (errFile, ResFile) {
                         if (errFile) {
                         //console.log("Error " + errFile);
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while searching for Uploaded file %s with object type : Voice app clip , version : %s   ',reqId,Fileuuid,version,err);
                         callback(errFile, undefined);
                         }
                         else {
                         try{
                         ResFile.setApplication(AppObj).complete(function (errupdt, resupdt) {
                         if (errupdt) {
                         //console.log("Error " + errupdt);
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while attaching uploaded file %s to application &s',reqId,ResFile,AppObj,errupdt);
                         callback(errupdt, undefined);
                         }
                         else
                         {
                         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Attaching uploaded file %s to application &s is succeeded',reqId,ResFile,AppObj);
                         callback(undefined, "Done");
                         }
                         });
                         }catch(ex)
                         {
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Exception occurred when attaching uploaded file to application method starts',reqId);
                         callback(ex,undefined);
                         }
                         }
                         });
                         }
                         catch(ex)
                         {
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Exception occurred when Uploaded file searching starts',reqId);
                         callback(ex,undefined);
                         }
                         }
                         else {
                         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   %s of Uploaded files found :  %s',reqId,(resFile.length+1),JSON.stringify(resFile));
                         for (var index in resFile) {
                         //console.log("Result length " + FileObj[index]);

                         if (resFile[index].Version == version) {
                         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Version %s is already up to date of file % ',reqId,resFile[index].Version,resFile[index].Filename);
                         callback("Already up to date", undefined);
                         }
                         else {
                         try
                         {
                         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Make Files uploads to null of Application %s ',reqId,JSON.stringify(AppObj));
                         AppObj.setFileUpload(null).complete(function (errRem, resRem) {
                         if (errRem) {
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when Make Files uploads to null of Application %s',reqId,JSON.stringify(AppObj),errRem);
                         callback(errRem, undefined);
                         }
                         else {
                         //console.log(JSON.stringify(FileObj[index]) + " null");
                         try{
                         DbConn.FileUpload
                         .find({where: [{UniqueId: Fileuuid},{ApplicationId: AppId}, {Version: version}]})
                         .complete(function (errFile, ResFile) {
                         if (errFile) {
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred while searching for Uploaded file %s',reqId,Fileuuid,errFile);
                         callback(errFile, undefined);
                         }
                         else {
                         try{
                         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(AppObj));
                         ResFile.setApplication(AppObj).complete(function (errupdt, resupdt) {
                         if (errupdt) {
                         //console.log("Error " + errupdt);
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(AppObj),errupdt);
                         callback(errupdt, undefined);
                         }
                         else {
                         logger.info('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s is succeeded ',reqId,JSON.stringify(ResFile),JSON.stringify(AppObj),errupdt);
                         callback(undefined, "Done");
                         }
                         });
                         }
                         catch(ex)
                         {
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when mapping Uploaded file with Application process starts',reqId,ex);
                         callback(ex,undefined);
                         }
                         }
                         });
                         }
                         catch (ex)
                         {
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when searching uploaded file records',reqId,ex);
                         callback(ex,undefined);
                         }
                         }

                         });
                         }
                         catch (ex)
                         {
                         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when detach Uploaded files from Application',reqId,ex);
                         callback(ex,undefined);
                         }
                         }
                         }
                         }
                         }

                         });*/

                    }
                    catch(ex)
                    {
                        logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when searching for Application',reqId,ex);
                        callback(ex,undefined);
                    }



                }
                else
                {
                    logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   No uploaded file record found for file name %s',reqId,Fileuuid,ex);
                    callback(new Error("No file found"),undefined);
                }

            }).catch(function (errFile) {

                logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while searching uploaded file %s  with  Application %s',reqId,Fileuuid,AppId,errFile);
                callback(errFile,undefined);

            });


        /*complete(function (err, FileObj)
         {
         if(err)
         {
         //console.log("Err "+err);
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while searching uploaded file %s  with  Application %s',reqId,Fileuuid,AppId,err);
         callback(err,undefined);
         }
         else
         {
         if(FileObj)
         {
         //console.log("Result length "+FileObj.length);
         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  %s Records found for uploaded file %s  with Application %s',reqId,FileObj.length,Fileuuid,AppId,err);
         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Searching for Application %s',reqId,AppId);
         try {
         DbConn.Application.find({where: [{id: AppId}]}).complete(function (errz, AppObj) {

         if (errz) {
         //console.log("Err " + errz);
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while searching for application %s  ',reqId,AppId,err);
         callback(errz, undefined);
         }
         else {
         if (FileObj.length == 0) {
         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Only one file found %s',reqId,JSON.stringify(FileObj));
         try
         {
         DbConn.FileUpload
         .find({where: [{UniqueId: Fileuuid}, {ObjType: 'Voice app clip'}, {Version: version}]})
         .complete(function (errFile, ResFile) {
         if (errFile) {
         //console.log("Error " + errFile);
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while searching for Uploaded file %s with object type : Voice app clip , version : %s   ',reqId,Fileuuid,version,err);
         callback(errFile, undefined);
         }
         else {
         try{
         ResFile.setApplication(AppObj).complete(function (errupdt, resupdt) {
         if (errupdt) {
         //console.log("Error " + errupdt);
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -  Error occurred while attaching uploaded file %s to application &s',reqId,ResFile,AppObj,errupdt);
         callback(errupdt, undefined);
         }
         else
         {
         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Attaching uploaded file %s to application &s is succeeded',reqId,ResFile,AppObj);
         callback(undefined, "Done");
         }
         });
         }catch(ex)
         {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Exception occurred when attaching uploaded file to application method starts',reqId);
         callback(ex,undefined);
         }
         }
         });
         }
         catch(ex)
         {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Exception occurred when Uploaded file searching starts',reqId);
         callback(ex,undefined);
         }
         }
         else {
         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   %s of Uploaded files found :  %s',reqId,(FileObj.length+1),JSON.stringify(FileObj));
         for (var index in FileObj) {
         //console.log("Result length " + FileObj[index]);

         if (FileObj[index].Version == version) {
         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Version %s is already up to date of file % ',reqId,FileObj[index].Version,FileObj[index].Filename);
         callback("Already up to date", undefined);
         }
         else {
         try
         {
         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] -   Make Files uploads to null of Application %s ',reqId,JSON.stringify(AppObj));
         AppObj.setFileUpload(null).complete(function (errRem, resRem) {
         if (errRem) {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when Make Files uploads to null of Application %s',reqId,JSON.stringify(AppObj),errRem);
         callback(errRem, undefined);
         }
         else {
         //console.log(JSON.stringify(FileObj[index]) + " null");
         try{
         DbConn.FileUpload
         .find({where: [{UniqueId: Fileuuid},{ApplicationId: AppId}, {Version: version}]})
         .complete(function (errFile, ResFile) {
         if (errFile) {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred while searching for Uploaded file %s',reqId,Fileuuid,errFile);
         callback(errFile, undefined);
         }
         else {
         try{
         logger.debug('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(AppObj));
         ResFile.setApplication(AppObj).complete(function (errupdt, resupdt) {
         if (errupdt) {
         //console.log("Error " + errupdt);
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Error occurred when mapping Uploaded file %s with Application %s',reqId,JSON.stringify(ResFile),JSON.stringify(AppObj),errupdt);
         callback(errupdt, undefined);
         }
         else {
         logger.info('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Mapping Uploaded file %s with Application %s is succeeded ',reqId,JSON.stringify(ResFile),JSON.stringify(AppObj),errupdt);
         callback(undefined, "Done");
         }
         });
         }
         catch(ex)
         {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when mapping Uploaded file with Application process starts',reqId,ex);
         callback(ex,undefined);
         }
         }
         });
         }
         catch (ex)
         {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when searching uploaded file records',reqId,ex);
         callback(ex,undefined);
         }
         }

         });
         }
         catch (ex)
         {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when detach Uploaded files from Application',reqId,ex);
         callback(ex,undefined);
         }
         }
         }
         }
         }

         });

         }
         catch(ex)
         {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when searching for Application',reqId,ex);
         callback(ex,undefined);
         }



         }
         else
         {
         logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   No uploaded file record found for file name %s',reqId,Fileuuid,ex);
         callback("err",undefined);
         }
         }

         });*/
    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.UploadAssignToApplication] - [%s] - [PGSQL] -   Exception occurred when File attaching method strats',reqId,ex);
        callback(ex,undefined);
    }

}

function DeveloperVoiceRecordsUploading(Fobj,rand2,cmp,ten,ref,appId,Disname,callback)
{
    try
    {
        var DisplyArr = Fobj.path.split('\\');

        var DisplayName=DisplyArr[DisplyArr.length-1];
    }
    catch(ex)
    {
        callback(ex,undefined);
    }

    try
    {
        FindCurrentVersion(Fobj,function(err,result)
        {
            if(err)
            {
                callback(err,undefined);
            }
            else
            {
                try
                {
                    var NewUploadObj = DbConn.FileUpload
                        .build(
                        {
                            UniqueId: rand2,
                            FileStructure: Fobj.type,
                            ObjClass: 'body.ObjClass',
                            ObjType: 'Voice Recording',
                            ObjCategory: 'body.ObjCategory',
                            URL: Fobj.path,
                            UploadTimestamp: Date.now(),
                            Filename: Fobj.name,
                            Version:result,
                            DisplayName: Disname,
                            CompanyId:cmp,
                            TenantId: ten,
                            RefId:ref,
                            ApplicationId:appId



                        }
                    );
                    //log.info('New Uploading record  : '+NewUploadObj);
                    NewUploadObj.save().complete(function (err, result) {
                        if (!err) {
                            var status = 1;

                            // log.info('Successfully saved '+NewUploadObj.UniqueId);
                            console.log("..................... Saved Successfully ....................................");
                            // var jsonString = messageFormatter.FormatMessage(err, "Saved to pg", true, result);
                            callback(undefined, NewUploadObj.UniqueId);
                            // res.end();


                        }
                        else {
                            // log.error("Error in saving "+err);
                            console.log("..................... Error found in saving.................................... : " + err);
                            //var jsonString = messageFormatter.FormatMessage(err, "ERROR found in saving to PG", false, null);
                            callback(err, undefined);
                            //res.end();
                        }


                    });
                }
                catch(ex)
                {
                    callback(ex,undefined);
                }
            }
        });

    }
    catch(ex)
    {
        callback(ex,undefined);
    }

}

function PickAllVoiceRecordingsOfApplication(AppId,callback) {
    try {
        DbConn.FileUpload.findAll({where: [{ApplicationId: AppId}, {ObjType: 'Voice Recording'}]}).complete(function (err, result) {

            if (err) {
                callback(err, undefined);
            }
            else {
                callback(undefined, JSON.stringify(result));
            }
        });


    }


    catch (ex) {
        callback(ex, undefined);
    }


}

function PickAllVoiceAppClipsOfApplication(AppId,callback) {
    try {
        DbConn.FileUpload.findAll({where: [{ApplicationId: AppId}, {ObjType: 'Voice app clip'}]}).complete(function (err, result) {

            if (err) {
                callback(err, undefined);
            }
            else {
                callback(undefined, JSON.stringify(result));
            }
        });


    }


    catch (ex) {
        callback(ex, undefined);
    }


}

function PickCallRecordById(RecId,callback) {
    try {
        DbConn.FileUpload.find({where: [{UniqueId: RecId}, {ObjType: 'Voice Recording'}]}).complete(function (err, result) {

            if (err) {
                callback(err, undefined);
            }
            else {
                callback(undefined, JSON.stringify(result));
            }
        });


    }


    catch (ex) {
        callback(ex, undefined);
    }


}

function PickVoiceAppClipById(RecId,callback) {
    try {
        DbConn.FileUpload.find({where: [{UniqueId: RecId}, {ObjType: 'Voice app clip'}]}).complete(function (err, result) {

            if (err) {
                callback(err, undefined);
            }
            else {
                callback(undefined, JSON.stringify(result));
            }
        });


    }


    catch (ex) {
        callback(ex, undefined);
    }


};

function FileAssignWithApplication(fileUID,appID,Company,Tenant,callback)
{
    if(fileUID&&appID&&!isNaN(appID))
    {
        try
        {
            DbConn.FileUpload.find({where:[{UniqueId:fileUID},{CompanyId:Company},{TenantId:Tenant}]}).
                then(function (resFile) {
                    if(!resFile)
                    {
                        callback(new Error("No file"),undefined);
                    }
                    else
                    {
                        DbConn.Application.find({where:[{id:appID}]}).
                            then(function (resApp) {

                                if(!resApp)
                                {
                                    callback(new Error("No Application"),undefined);
                                }
                                else
                                {
                                    try
                                    {
                                        DbConn.FileUpload.find({where:[{Filename:resFile.Filename},{CompanyId:resFile.CompanyId},{TenantId:resFile.TenantId},{ApplicationId:appID}]}).then(function (resVFileNm) {

                                            if(!resVFileNm)
                                            {
                                                //callback(new Error("No suchFile"),undefined) ;
                                                resFile.setApplication(resApp).then(function (resAdd) {

                                                    callback(undefined,resAdd);
                                                }).catch(function (errAdd) {

                                                    callback(errAdd,undefined);
                                                });


                                            }
                                            else
                                            {
                                                if(fileUID==resVFileNm.UniqueId)
                                                {
                                                    callback(undefined,new Object("Already assigned"));
                                                }
                                                else
                                                {
                                                    resVFileNm.setApplication(null).then(function (resNull) {

                                                        resFile.setApplication(resApp).then(function (resMap) {
                                                            callback(undefined,resMap);
                                                        }).catch(function (errMap) {
                                                            callback(errMap, undefined);
                                                        });



                                                    }).catch(function (errNull) {
                                                        callback(errNull,undefined);
                                                    });

                                                }
                                            }

                                        }).catch(function (errVFileNm) {
                                            callback(errVFileNm,undefined);
                                        });


                                    }
                                    catch(ex)
                                    {
                                        callback(ex,undefined);
                                    }
                                }

                            }).catch(function (errApp) {
                                callback(errApp,undefined);
                            });

                    }
                }).catch(function (errFile) {
                    callback(errFile,undefined);
                });

        }
        catch(ex)
        {
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("Invalid Inputs"),undefined);
    }

};

function DetachFromApplication(fileUID,Company,Tenant,callback)
{
    if(fileUID)
    {
        try
        {
            DbConn.FileUpload.find({where:[{UniqueId:fileUID},{CompanyId:Company},{TenantId:Tenant}]}).
                then(function (resFile) {
                    if(!resFile)
                    {
                        callback(new Error("No file"),undefined);
                    }
                    else
                    {
                        resFile.setApplication(null).then(function (resNull) {

                            callback(undefined,resNull);

                        }).catch(function (errNull) {
                            callback(errNull,undefined);
                        });

                    }
                }).catch(function (errFile) {
                    callback(errFile,undefined);
                });

        }
        catch(ex)
        {
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("Invalid Inputs"),undefined);
    }

};


function DeveloperUploadFiles(Fobj,rand2,cmp,ten,ref,option,Clz,Type,Category,resvID,reqId,callback)
{

    try
    {


        var DisplayName="";


        if(Fobj.display){


            DisplayName = Fobj.display;
        }
        else
        {
            DisplayName=Fobj.name;
        }

        // is in processing level


        if(option=="LOCAL")
        {
            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment  successfully inserted to Local',reqId);
            //callback(undefined, resUpFile.UniqueId);
            FileUploadDataRecorder(Fobj,rand2,cmp,ten,ref,Clz,Type,Category,DisplayName,resvID,reqId, function (err,res) {
                callback(err,rand2);
            });
        }
        else if(option=="MONGO")
        {
            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment on process of uploading to MongoDB',reqId);

            if(resvID)
            {
                rand2=resvID;
            }

            console.log("TO MONGO >>>>>>>>> "+rand2);
            MongoUploader(rand2,Fobj,reqId,function(errMongo,resMongo)
            {
                if(errMongo)
                {
                    console.log(errMongo);
                    callback(errMongo,undefined);
                }
                else
                {
                    console.log(resMongo);
                    // callback(undefined,resUpFile.UniqueId);
                    FileUploadDataRecorder(Fobj,rand2,cmp,ten,ref,Clz,Type,Category,DisplayName ,resvID,reqId, function (err,res) {
                        if(err)
                        {
                            callback(err,undefined);

                        }
                        else
                        {
                            if(res)
                            {
                                callback(undefined,res);
                            }
                            else
                            {
                                callback(new Error("Error in Operation "),undefined);
                            }
                        }
                    });
                }



            });
        }
        // sprint 5
        /*else if(option=="COUCH")
         {
         logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment object %s on process of uploading to COUCH',reqId);
         console.log("TOCOUCH >>>>>>>>> "+rand2);
         CouchUploader(rand2,Fobj,resUpFile,reqId,function(errCouch,resCouch)
         {
         if(errCouch)
         {
         console.log(errCouch);
         callback(errCouch,undefined);
         }
         else
         {
         console.log(resCouch);
         FileUploadDataRecorder(Fobj,rand2,cmp,ten,ref,Clz,Type,Category,result, function (err,res) {
         callback(err,res.UniqueId);
         });
         }

         });

         }*/




    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred when new attachment object saving starting ',reqId,ex);
        callback(ex,undefined);
    }






}

function DeveloperReserveFiles(Display,fileName,rand2,cmp,ten,Clz,Category,reqId,callback)
{

    try
    {



        FindCurrentVersion( fileName,cmp, ten, reqId, function (errVersion, resVersion) {

            if(errVersion)
            {
                callback(errVersion,undefined);
            }
            else
            {
                try {
                    var NewUploadObj = DbConn.FileUpload
                        .build(
                        {
                            UniqueId: rand2,
                            ObjClass: Clz,
                            ObjCategory: Category,
                            Filename: fileName,
                            Version: resVersion,
                            DisplayName: Display,
                            CompanyId: cmp,
                            TenantId: ten,
                            Status:"PROCESSING",
                            UploadTimestamp: Date.now()


                        }
                    );
                    //logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - New attachment object %s',reqId,JSON.stringify(NewUploadObj));
                    NewUploadObj.save().then(function (resUpFile) {

                        //logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s successfully inserted',reqId,JSON.stringify(NewUploadObj));
                        if (resUpFile) {
                            DbConn.FileCategory.find({where: {Category: Category}}).then(function (resCat) {

                                if (resCat) {
                                    resUpFile.setFileCategory(resCat.id).then(function (resCatset) {

                                        callback(undefined, resUpFile.UniqueId);

                                    }).catch(function (errCatSet) {
                                        callback(errCatSet, undefined);
                                    });
                                }
                                else {
                                    callback(undefined, resUpFile.UniqueId)
                                }


                            }).catch(function (errCat) {
                                callback(errCat, undefined);
                            });
                        }
                        else {
                            callback(new Error("Upload records saving failed"), undefined);
                        }


                    }).catch(function (errUpFile) {

                        //logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s insertion failed',reqId,JSON.stringify(NewUploadObj),errUpFile);
                        callback(errUpFile, undefined);


                    });

                }
                catch (ex) {
                    //logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred when new attachment object creating ',reqId,ex);
                    callback(ex, undefined);
                }

            }

        });



    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DeveloperReserveFiles] - [%s] - Exception occurred when placing reservation for a file  ',reqId,ex);
        callback(ex,undefined);
    }






}
function FileUploadDataRecorder(Fobj,rand2,cmp,ten,ref,Clz,Type,Category,desplayname,resvID,reqId,callback ) {
    var result = 0;


    if (resvID) {
        // reserved file and no similar files found
        DbConn.FileUpload.update({Status: "UPLOADED",FileStructure: Fobj.type,ObjType: Type,URL: Fobj.path,RefId: ref},
            {
                where:
                    [{UniqueId: resvID},{Status: "PROCESSING"}]

            }).then(function (resUpdate) {
                callback(undefined, resvID);
            }).catch(function (errUpdate) {
                callback(errUpdate, undefined);
            });


    }
    else {
        // not a reserved file


        FindCurrentVersion(Fobj.name, cmp, ten, reqId, function (errVersion, resVersion) {
            if (errVersion) {
                callback(errVersion, undefined);
            }
            else {
                result = resVersion;
                try {
                    var NewUploadObj = DbConn.FileUpload
                        .build(
                        {
                            UniqueId: rand2,
                            FileStructure: Fobj.type,
                            ObjClass: Clz,
                            ObjType: Type,
                            ObjCategory: Category,
                            URL: Fobj.path,
                            UploadTimestamp: Date.now(),
                            Filename: Fobj.name,
                            Version: result,
                            DisplayName: desplayname,
                            CompanyId: cmp,
                            TenantId: ten,
                            RefId: ref


                        }
                    );
                    //logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - New attachment object %s',reqId,JSON.stringify(NewUploadObj));
                    NewUploadObj.save().then(function (resUpFile) {

                        //logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s successfully inserted',reqId,JSON.stringify(NewUploadObj));
                        if (resUpFile) {
                            DbConn.FileCategory.find({where: {Category: Category}}).then(function (resCat) {

                                if (resCat) {
                                    resUpFile.setFileCategory(resCat.id).then(function (resCatset) {

                                        callback(undefined, resUpFile.UniqueId);

                                    }).catch(function (errCatSet) {
                                        callback(errCatSet, undefined);
                                    });
                                }
                                else {
                                    callback(undefined, resUpFile.UniqueId)
                                }


                            }).catch(function (errCat) {
                                callback(errCat, undefined);
                            });
                        }
                        else {
                            callback(new Error("Upload records saving failed"), undefined);
                        }


                    }).catch(function (errUpFile) {

                        //logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s insertion failed',reqId,JSON.stringify(NewUploadObj),errUpFile);
                        callback(errUpFile, undefined);


                    });

                }
                catch (ex) {
                    //logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred when new attachment object creating ',reqId,ex);
                    callback(ex, undefined);
                }
            }


        });


    }
};


module.exports.DeveloperUploadFiles = DeveloperUploadFiles;
module.exports.UploadAssignToApplication = UploadAssignToApplication;
module.exports.DeveloperVoiceRecordsUploading = DeveloperVoiceRecordsUploading;
module.exports.PickAllVoiceRecordingsOfApplication = PickAllVoiceRecordingsOfApplication;
module.exports.PickAllVoiceAppClipsOfApplication = PickAllVoiceAppClipsOfApplication;
module.exports.PickCallRecordById = PickCallRecordById;
module.exports.PickVoiceAppClipById = PickVoiceAppClipById;
module.exports.FileAssignWithApplication = FileAssignWithApplication;
module.exports.CouchUploader = CouchUploader;
module.exports.DetachFromApplication = DetachFromApplication;
module.exports.DeveloperReserveFiles = DeveloperReserveFiles;

//module.exports.DeveloperUploadFilesTest = DeveloperUploadFilesTest;


