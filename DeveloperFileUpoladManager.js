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

//var couchbase = require('couchbase');
var Cbucket=config.Couch.bucket;
var CHip=config.Couch.ip;
//var cluster = new couchbase.Cluster("couchbase://"+CHip);

//


var fs=require('fs');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var easyimg = require('easyimage');
var RedisPublisher=require('./RedisPublisher.js');
var util = require('util');


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



var mongoip = config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodbase=config.Mongo.dbname;
var mongopass=config.Mongo.password;
var mongouser=config.Mongo.user;
var mongoreplicaset=config.Mongo.replicaset;

var mongodb = require('mongodb');
var gm = require('gm').subClass({imageMagick: true});
var async= require('async');
var path=require('path');
var mkdirp = require('mkdirp');

const crypto = require('crypto');

var crptoAlgo = config.Crypto.algo;
var crptoPwd = config.Crypto.password;

var uri = '';
mongoip = mongoip.split(',')
if(util.isArray(mongoip)){

    mongoip.forEach(function(item){
        uri += util.format('%s:%d,',item,mongoport)
    });

    uri = uri.substring(0, uri.length - 1);
    uri = util.format('mongodb://%s:%s@%s/%s',mongouser,mongopass,uri,mongodbase);

    if(mongoreplicaset){
        uri = util.format('%s?replicaSet=%s',uri,mongoreplicaset) ;
        console.log("URI ...   "+uri);
    }
}else{

    uri = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodbase);
    console.log("URI ...   "+uri);
}


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


function LocalThumbnailMaker(uuid,Fobj,Category,thumbDir,callback)
{
    var sizeArray=['75','100','125','150','200'];
    var thumbnailArray=[];

    var fileStruct=Fobj.type.split("/")[0];
    var file_category=Category;


    try {
        if (fileStruct == "image") {
            mkdirp(thumbDir, function (err) {
                if (!err) {
                    //var readStream=fs.createReadStream(path.join(Fobj.tempPath));
                    console.log(path.join(Fobj.tempPath));


                    sizeArray.forEach(function (size) {


                        thumbnailArray.push(function createContact(callbackThumb) {

                            var readStream=fs.createReadStream(path.join(Fobj.tempPath));
                            var writeStream = fs.createWriteStream(path.join(thumbDir, uuid.toString() + "_" + size.toString()));


                            gm(readStream).resize(size, size).quality(50).stream(function(err,stdout,stderr)
                            {
                                stdout.pipe(writeStream).on('error', function (error) {
                                    console.log("Error in making thumbnail " + uuid + "_" + size);
                                    callbackThumb(error, undefined);
                                }).on('finish', function () {
                                    console.log("Making thumbnail " + uuid + "_" + size + " Success");
                                    callbackThumb(undefined, "Done");
                                });
                            });



                        });
                    });

                    async.series(thumbnailArray, function (errThumbMake, resThumbMake) {

                        callback(undefined, uuid);


                    });


                }
                else {
                    console.log("Error in storage location of thumbnail " + uuid + "_" + "100");

                    callback(err, uuid);
                }
            });

        }
        else {
            callback(undefined, uuid);
        }
    } catch (e) {
        console.log("Error in operation of localy stored thumbnail creation of " + uuid + "_100");
        callback(e, uuid);
    }


    //.............................................................................


    /*if(fileStruct=="image")
     {
     sizeArray.forEach(function (size) {

     thumbnailArray.push(function createContact(callbackThumb)
     {

     gm(fs.createReadStream(Fobj.path)).resize(size, size).quality(50)
     .stream(function (err, stdout, stderr) {
     var writeStream = ThumbBucket.openUploadStream(uuid + "_"+size);
     stdout.pipe(writeStream).on('error', function(error)
     {
     console.log("Error in making thumbnail "+uuid + "_"+size);
     callbackThumb(error,undefined);
     }). on('finish', function()
     {
     console.log("Making thumbnail "+uuid + "_"+size+" Success");
     callbackThumb(undefined,"Thumbnails created ");
     });
     });
     });
     });

     async.series(thumbnailArray, function (errThumbMake,resThumbMake) {


     console.log("End of Thumbnail making");
     fs.unlink(path.join(Fobj.path));
     db.close();
     callback(undefined,uuid);


     });
     }
     else
     {
     fs.unlink(path.join(Fobj.path));
     db.close();
     callback(undefined,uuid);
     }*/



}


function MongoFileUploader(dataObj,callback)
{
    var sizeArray=['75','100','125','150','200'];
    var thumbnailArray=[];

    var fileStruct=dataObj.Fobj.type.split("/")[0];

    /*var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;*/
    mongodb.MongoClient.connect(uri, function(error, db)
    {

        if(error)
        {
            console.log("Mongo connection error "+error);
            callback(error,undefined);
        }
        else
        {
            var bucket = new mongodb.GridFSBucket(db);
            var ThumbBucket = new mongodb.GridFSBucket(db,{ bucketName: 'thumbnails' });
            console.log(dataObj.Fobj.path);
            var uploadReadStream = fs.createReadStream(dataObj.Fobj.path);
            var bucketUploadStream=bucket.openUploadStream(dataObj.rand2);

            if(dataObj.encNeeded)
            {
                const cipher = crypto.createCipher(crptoAlgo, crptoPwd);
                console.log("Encripting");
                uploadReadStream.pipe(cipher).pipe(bucketUploadStream).on('error', function(error) {
                    // assert.ifError(error);
                    //fs.unlink(path.join(Fobj.path));
                    cipher.end();
                    console.log("Error in Encripted stream uploading to DB "+error);
                    db.close();

                    callback(error,undefined);
                }).
                on('finish', function() {
                    console.log('uploaded to Mongo!');
                    cipher.end();
                    RedisPublisher.updateFileStorageRecord(dataObj.Category, dataObj.Fobj.sizeInMB,dataObj.cmp,dataObj.ten);

                    if(fileStruct=="image")
                    {
                        sizeArray.forEach(function (size) {


                            thumbnailArray.push(function createContact(callbackThumb)
                            {



                                gm(fs.createReadStream(dataObj.Fobj.path)).resize(size, size).quality(50)
                                    .stream(function (err, stdout, stderr) {
                                        var writeStream = ThumbBucket.openUploadStream(dataObj.rand2 + "_"+size);
                                        stdout.pipe(writeStream).on('error', function(error)
                                        {
                                            console.log("Error in making thumbnail "+dataObj.rand2 + "_"+size);
                                            callbackThumb(error,undefined);
                                        }). on('finish', function(thumb)
                                        {

                                            console.log("Making thumbnail "+dataObj.rand2 + "_"+size+" Success");
                                            callbackThumb(undefined,"Thumbnails created ");
                                        });
                                    });
                            });
                        });

                        async.series(thumbnailArray, function (errThumbMake,resThumbMake) {
                            console.log(dataObj.Fobj.tempPath);
                            //fs.unlink(path.join(Fobj.tempPath));
                            db.close();
                            callback(undefined,dataObj.rand2);


                        });
                    }
                    else
                    {
                        //fs.unlink(path.join(Fobj.tempPath));
                        db.close();
                        callback(undefined,dataObj.rand2);
                    }


                });


            }
            else
            {
                uploadReadStream.pipe(bucketUploadStream).
                on('error', function(error) {
                    // assert.ifError(error);
                    //fs.unlink(path.join(Fobj.tempPath));
                    console.log("Error "+error);
                    db.close();
                    callback(error,undefined);
                }).
                on('finish', function() {
                    console.log('uploaded to Mongo!');
                    RedisPublisher.updateFileStorageRecord(dataObj.Category, dataObj.Fobj.sizeInMB,dataObj.cmp,dataObj.ten);

                    if(fileStruct=="image")
                    {
                        sizeArray.forEach(function (size) {

                            thumbnailArray.push(function createContact(callbackThumb)
                            {

                                gm(fs.createReadStream(dataObj.Fobj.path)).resize(size, size).quality(50)
                                    .stream(function (err, stdout, stderr) {
                                        var writeStream = ThumbBucket.openUploadStream(dataObj.rand2 + "_"+size);
                                        stdout.pipe(writeStream).on('error', function(error)
                                        {
                                            console.log("Error in making thumbnail "+dataObj.rand2 + "_"+size);
                                            callbackThumb(error,undefined);
                                        }). on('finish', function()
                                        {
                                            console.log("Making thumbnail "+dataObj.rand2 + "_"+size+" Success");
                                            callbackThumb(undefined,"Thumbnails created ");
                                        });
                                    });
                            });
                        });

                        async.series(thumbnailArray, function (errThumbMake,resThumbMake) {


                            console.log("End of Thumbnail making");
                            //fs.unlink(path.join(Fobj.tempPath));
                            db.close();
                            callback(undefined,dataObj.rand2);


                        });
                    }
                    else
                    {
                        //fs.unlink(path.join(Fobj.tempPath));
                        db.close();
                        callback(undefined,dataObj.rand2);
                    }


                });
            }
        }
        //console.log("db "+JSON.stringify(db));
        //assert.ifError(error);




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


function localStoreHandler(fileData,callback) {

    console.log("Uploading to LOCAL");
    var Today= new Date();
    var date= Today.getDate();
    var month=Today.getMonth()+1;
    var year =Today.getFullYear();
    var file_category=fileData.Fobj.Category;

    var newDir = path.join(config.BasePath,"Company_"+fileData.cmp.toString()+"_Tenant_"+fileData.ten.toString(),file_category,year.toString()+"-"+month.toString()+"-"+date.toString());
    var thumbDir = path.join(config.BasePath,"Company_"+fileData.cmp.toString()+"_Tenant_"+fileData.ten.toString(),file_category+"_thumb",year.toString()+"-"+month.toString()+"-"+date.toString());
    fileData.Fobj.thumbDir=thumbDir;

    mkdirp(newDir, function(err) {

        if(err)
        {
            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Failed to lode specific location to save',fileData.reqId);
            callback(err,undefined);
        }
        else
        {
            console.log("Uploading path : "+path.join(newDir,fileData.rand2.toString()));
            const cipher = crypto.createCipher(crptoAlgo, crptoPwd);

            if(fileData.encNeeded)
            {


                fs.createReadStream(fileData.Fobj.path).pipe(cipher).pipe(fs.createWriteStream(path.join(newDir,fileData.rand2.toString()))).on('error', function (error) {
                    cipher.end();
                    console.log("Error in piping and encrypting");
                    logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Error in piping and encrypting',fileData.reqId);
                    callback(error,undefined);

                }).on('finish', function () {
                    console.log("File  encrypted and stored");
                    cipher.end();
                    fileData.Fobj.path=path.join(newDir,fileData.rand2.toString());
                    fileData.Fobj.thumbDir=thumbDir;
                    logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - File  encrypted and stored',fileData.reqId);
                    callback(undefined,fileData.Fobj);


                    /*RedisPublisher.updateFileStorageRecord(file_category,Fobj.sizeInMB,cmp,ten);


                     Fobj.path=path.join(newDir,rand2.toString());

                     FileUploadDataRecorder(Fobj,rand2,cmp,ten,ref,Clz,Type,Category,DisplayName,resvID,reqId, function (err,res) {

                     // callback(err,rand2);

                     if(err)
                     {
                     //fs.unlink(path.join(Fobj.path));
                     callback(err,rand2);
                     }
                     else
                     {
                     console.log("File record added");
                     LocalThumbnailMaker(rand2,Fobj,Category,thumbDir, function (errThumb,resThumb) {
                     //fs.unlink(path.join(Fobj.tempPath));
                     callback(err,rand2);

                     });
                     }





                     });

                     */

                });
            }
            else
            {
                fs.createReadStream(fileData.Fobj.path).pipe(fs.createWriteStream(path.join(newDir,fileData.rand2.toString()))).on('error', function (error) {

                    console.log("Error in piping ");
                    logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Error in piping',fileData.reqId);
                    callback(error,undefined);

                    /*
                     RedisPublisher.updateFileStorageRecord(file_category,Fobj.sizeInMB,cmp,ten);
                     LocalThumbnailMaker(rand2,Fobj,Category,thumbDir, function (errThumb,resThumb) {
                     //fs.unlink(path.join(Fobj.path));
                     Fobj.path=path.join(newDir,rand2.toString());
                     FileUploadDataRecorder(Fobj,rand2,cmp,ten,ref,Clz,Type,Category,DisplayName,resvID,reqId, function (err,res) {


                     callback(err,rand2);
                     });

                     });*/


                }).on('finish', function () {
                    console.log("File stored");
                    fileData.Fobj.path=path.join(newDir,fileData.rand2.toString());
                    fileData.Fobj.thumbDir=thumbDir;
                    logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - File stored',fileData.reqId);
                    callback(undefined,fileData.Fobj);



                    /*Fobj.path=path.join(newDir,rand2.toString());

                     RedisPublisher.updateFileStorageRecord(file_category,Fobj.sizeInMB,cmp,ten);

                     FileUploadDataRecorder(Fobj,rand2,cmp,ten,ref,Clz,Type,Category,DisplayName,resvID,reqId, function (err,res) {

                     if(err)
                     {
                     //fs.unlink(path.join(Fobj.path));
                     callback(err,rand2);
                     }
                     else
                     {
                     console.log("File record added");
                     LocalThumbnailMaker(rand2,Fobj,Category,thumbDir, function (errThumb,resThumb) {
                     callback(errThumb,resThumb);
                     //fs.unlink(path.join(Fobj.tempPath));


                     });
                     }

                     });

                     */


                });
            }




        }
        // path exists unless there was an error

    });

}


function localStorageRecordHandler(dataObj,callback)
{
    localStoreHandler(dataObj,function (errStore,resStore) {

        if(errStore)
        {
            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Failed to lod specific location to save',reqId);
            callback(errStore,undefined,dataObj.tempPath);
        }
        else if(resStore)
        {
            resStore.Source="LOCAL";
            dataObj.Fobj=resStore;
            RedisPublisher.updateFileStorageRecord(resStore.Category,resStore.sizeInMB,dataObj.cmp,dataObj.ten);
            recordFileDetails(dataObj, function (err,res) {

                if(err)
                {
                    callback(err,dataObj.rand2,dataObj.tempPath);
                }
                else
                {
                    console.log("File record added");
                    LocalThumbnailMaker(dataObj.rand2,resStore,dataObj.Category,resStore.thumbDir, function (errThumb,resThumb) {

                        callback(errThumb,dataObj.rand2,dataObj.tempPath);

                    });
                }

            });
        }
        else
        {
            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Error in operation',reqId);
            callback(new Error("Error in operation"),undefined,dataObj.tempPath);
        }

    });
}

function mongoFileAndRecordHandler(dataObj,callback) {

    MongoFileUploader(dataObj,function(errMongo,resMongo)
    {
        if(errMongo)
        {
            console.log(errMongo);
            callback(errMongo,undefined,dataObj.tempPath);
        }
        else
        {
            console.log(resMongo);
            // callback(undefined,resUpFile.UniqueId);
            dataObj.Fobj.Source="MONGO";
            recordFileDetails(dataObj,function (err,res) {
                if(err)
                {
                    callback(err,undefined,dataObj.tempPath);

                }
                else
                {
                    if(res)
                    {
                        callback(undefined,res,dataObj.tempPath);
                    }
                    else
                    {
                        callback(new Error("Error in Operation "),undefined,dataObj.tempPath);
                    }
                }
            });
        }



    });

}


function DeveloperUploadFiles(fileObj,callback)
{



    try
    {
        var DisplayName="";
        fileObj.tempPath="";

        if(fileObj.Fobj.display){


            DisplayName = fileObj.Fobj.display;
            fileObj.DisplayName=DisplayName;
        }
        else
        {
            DisplayName=fileObj.Fobj.name;
            fileObj.DisplayName=DisplayName;
        }

        fileObj.Fobj.Category=fileObj.Category;

        fileObj.Fobj.sizeInMB=0;

        if(fileObj.Fobj.size!=0 && fileObj.Fobj.size)
        {
            fileObj.Fobj.sizeInMB = Math.floor(fileObj.Fobj.size/(1024*1024));
        }

        if(fileObj.Fobj.path)
        {
            fileObj.tempPath=fileObj.Fobj.path;
        }

        if(fileObj.resvID)
        {
            fileObj.rand2=fileObj.resvID;
        }




        DbConn.FileCategory.findOne({where:[{Category:fileObj.Category}]}).then(function (resCat) {

            if(resCat)
            {
                fileObj.encNeeded=resCat.Encripted;

                if(resCat.Source=="LOCAL")
                {


                    localStorageRecordHandler(fileObj,function (errStore,resStore,tempPath) {
                        callback(errStore,resStore,tempPath);
                    });

                }
                else if(resCat.Source=="MONGO")
                {
                    logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment on process of uploading to MongoDB',fileObj.reqId);
                    console.log("TO MONGO >>>>>>>>> "+fileObj.rand2);


                    mongoFileAndRecordHandler(fileObj,function (errStore,resStore,tempPath) {
                        callback(errStore,resStore,tempPath);
                    });

                }
                else
                {
                    if(fileObj.option.toUpperCase()=="LOCAL")
                    {
                        localStorageRecordHandler(fileObj,function (errStore,resStore,tempPath) {
                            callback(errStore,resStore,tempPath);
                        });

                    }
                    else if(fileObj.option.toUpperCase()=="MONGO")
                    {
                        logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment on process of uploading to MongoDB',fileObj.reqId);
                        console.log("TO MONGO >>>>>>>>> "+fileObj.rand2);

                        mongoFileAndRecordHandler(fileObj,function (errStore,resStore,tempPath) {
                            callback(errStore,resStore,tempPath);
                        });

                    }
                    else
                    {
                        callback(new Error("Invalid Storage option"),undefined);
                    }
                }




            }
            else
            {
                logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s]  -No file category found ',fileObj.reqId);
                callback(new Error("No file category found "),undefined);
            }
        }).catch(function (errCat) {
            logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - Error in checking file categories ',fileObj.reqId);
            callback(errCat,undefined);
        });


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


function recordFileDetails(dataObj,callback) {
    var result = 0;

    console.log("File saving to "+dataObj.Fobj.path);

    if (dataObj.resvID) {
        // reserved file and no similar files found
        DbConn.FileUpload.update({Status: "UPLOADED",FileStructure: dataObj.Fobj.type,ObjType: dataObj.Type,URL: dataObj.Fobj.path,RefId: dataObj.ref},
            {
                where:
                    [{UniqueId: dataObj.resvID},{Status: "PROCESSING"}]

            }).then(function (resUpdate) {
            callback(undefined, dataObj.resvID);
        }).catch(function (errUpdate) {
            callback(errUpdate, undefined);
        });


    }
    else {
        // not a reserved file


        FindCurrentVersion(dataObj.Fobj.name, dataObj.cmp, dataObj.ten, dataObj.reqId, function (errVersion, resVersion) {
            if (errVersion) {
                callback(errVersion, undefined);
            }
            else {
                result = resVersion;


                try {
                    var NewUploadObj = DbConn.FileUpload
                        .build(
                            {
                                UniqueId: dataObj.rand2,
                                FileStructure: dataObj.Fobj.type,
                                ObjClass: dataObj.Clz,
                                ObjType: dataObj.Type,
                                ObjCategory: dataObj.Category,
                                URL: dataObj.Fobj.path,
                                UploadTimestamp: Date.now(),
                                Filename: dataObj.Fobj.name,
                                Version: result,
                                DisplayName: dataObj.DisplayName,
                                CompanyId: dataObj.cmp,
                                TenantId: dataObj.ten,
                                RefId: dataObj.ref,
                                Size:dataObj.Fobj.sizeInMB,
                                Source:dataObj.Fobj.Source


                            }
                        );
                    //logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - New attachment object %s',reqId,JSON.stringify(NewUploadObj));
                    NewUploadObj.save().then(function (resUpFile) {

                        //logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s successfully inserted',reqId,JSON.stringify(NewUploadObj));
                        if (resUpFile) {
                            DbConn.FileCategory.find({where: {Category: dataObj.Category}}).then(function (resCat) {

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
}


module.exports.DeveloperUploadFiles = DeveloperUploadFiles;
module.exports.FileAssignWithApplication = FileAssignWithApplication;
module.exports.CouchUploader = CouchUploader;
module.exports.DetachFromApplication = DetachFromApplication;
module.exports.DeveloperReserveFiles = DeveloperReserveFiles;
module.exports.LocalThumbnailMaker = LocalThumbnailMaker;
module.exports.localStoreHandler = localStoreHandler;



