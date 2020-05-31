/**
 * Created by pawan on 4/9/2015.
 */
//.....................................................................................................
// change mongodb module to mongoDB (NOTE: not mongoose )
//.....................................................................................................

var DbConn = require('dvp-dbmodels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var fs=require('fs');
var logger = require('dvp-common-lite/LogHandler/CommonLogHandler.js').logger;
var config = require('config');
// sprint 5

//var couchbase = require('couchbase');
var Cbucket=config.Couch.bucket;
var CHip=config.Couch.ip;
//var cluster = new couchbase.Cluster("couchbase://"+CHip);

//

var fs=require('fs');
var logger = require('dvp-common-lite/LogHandler/CommonLogHandler.js').logger;
var easyimg = require('easyimage');
var RedisPublisher=require('./RedisPublisher.js');
var util = require('util');

var mongoip = config.Mongo.ip;
var mongoport = config.Mongo.port;
var mongodb = config.Mongo.dbname;
var mongouser = config.Mongo.user;
var mongopass = config.Mongo.password;
var mongoreplicaset = config.Mongo.replicaset;
var mongotype = config.Mongo.type;

var connectionstring = "";
mongoip = mongoip.split(",");

if (util.isArray(mongoip)) {
  if (mongoip.length > 1) {
    mongoip.forEach(function (item) {
      connectionstring +=
        mongoport == ""
          ? util.format("%s,", item)
          : util.format("%s:%d,", item, mongoport);
    });

    connectionstring = connectionstring.substring(
      0,
      connectionstring.length - 1
    );
    connectionstring = util.format(
      "%s://%s:%s@%s/%s",
      mongotype,
      mongouser,
      mongopass,
      connectionstring,
      mongodb
    );

    if (mongoreplicaset) {
      connectionstring = util.format(
        "%s?replicaSet=%s",
        connectionstring,
        mongoreplicaset
      );
    }
  } else {
    connectionstring =
      mongoport == ""
        ? util.format(
            "%s://%s:%s@%s/%s",
            mongotype,
            mongouser,
            mongopass,
            mongoip[0],
            mongodb
          )
        : util.format(
            "%s://%s:%s@%s:%d/%s",
            mongotype,
            mongouser,
            mongopass,
            mongoip[0],
            mongoport,
            mongodb
          );
  }
} else {
  connectionstring =
    mongoport == ""
      ? util.format(
          "%s://%s:%s@%s/%s",
          mongotype,
          mongouser,
          mongopass,
          mongoip,
          mongodb
        )
      : util.format(
          "%s://%s:%s@%s:%d/%s",
          mongotype,
          mongouser,
          mongopass,
          mongoip,
          mongoport,
          mongodb
        );
}

function FindCurrentVersion(fname,company,tenant,reqId,Category,callback)
{
    try
    {
        logger.debug('[DVP-FIleService.FindCurrentVersion.FindCurrentVersion] - [%s] - Searching for current version of %s',reqId,fname);
        DbConn.FileUpload.max('Version',{where: [{Filename: fname},{CompanyId:company},{TenantId:tenant},{ObjCategory:Category}]}).then(function (resFile) {

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


/*function LocalThumbnailMaker(uuid,Fobj,Category,thumbDir,reqId,callback)
 {
 var sizeArray=['75','100','125','150','200'];
 var thumbnailArray=[];

 var fileStruct=Fobj.type.split("/")[0];

 try {
 if (fileStruct == "image") {
 logger.info('[DVP-FIleService.LocalThumbnailMaker] - [%s] - Image file found to make thumbnails ',reqId,uuid);
 mkdirp(thumbDir, function (err) {

 if(err)
 {
 logger.error('[DVP-FIleService.LocalThumbnailMaker] - [%s] - Error occurred in making directory for thumbnails of %s ',reqId,uuid);
 callback(err, uuid);
 }
 else
 {
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

 });

 }
 else
 {
 callback(undefined, uuid);
 }
 } catch (e) {

 logger.error('[DVP-FIleService.LocalThumbnailMaker] - [%s] - Exception in operation of local thumbnail creation of %s ',reqId,uuid);
 callback(e, uuid);
 }


 }*/

function LocalThumbnailMaker(thumObj,callback)
{
    var sizeArray=['75','100','125','150','200'];
    var thumbnailArray=[];

    var fileStruct=thumObj.type.split("/")[0];

    try {
        if (fileStruct == "image") {
            logger.info('[DVP-FIleService.LocalThumbnailMaker] - [%s] - Image file found to make thumbnails ',thumObj.reqId,thumObj.uuid);
            mkdirp(thumObj.thumbDir, function (err) {

                if(err)
                {
                    logger.error('[DVP-FIleService.LocalThumbnailMaker] - [%s] - Error occurred in making directory for thumbnails of %s ',reqId,uuid);
                    callback(err, thumObj.uuid);
                }
                else
                {
                    console.log(path.join(thumObj.tempPath));


                    sizeArray.forEach(function (size) {


                        thumbnailArray.push(function createContact(callbackThumb) {

                            var readStream=fs.createReadStream(path.join(thumObj.tempPath));
                            var writeStream = fs.createWriteStream(path.join(thumObj.thumbDir, thumObj.uuid.toString() + "_" + size.toString()));


                            gm(readStream).resize(size, size).quality(50).stream(function(err,stdout,stderr)
                            {
                                stdout.pipe(writeStream).on('error', function (error) {
                                    console.log("Error in making thumbnail " + thumObj.uuid + "_" + size);
                                    callbackThumb(error, undefined);
                                }).on('finish', function () {
                                    console.log("Making thumbnail " + thumObj.uuid + "_" + size + " Success");
                                    callbackThumb(undefined, "Done");
                                });
                            });



                        });
                    });

                    async.series(thumbnailArray, function (errThumbMake, resThumbMake) {

                        callback(undefined, thumObj.uuid);


                    });
                }

            });

        }
        else
        {
            callback(undefined, thumObj.uuid);
        }
    } catch (e) {

        logger.error('[DVP-FIleService.LocalThumbnailMaker] - [%s] - Exception in operation of local thumbnail creation of %s ',thumObj.reqId,thumObj.uuid);
        callback(e, thumObj.uuid);
    }


}



function MongoFileUploader(dataObj,callback)
{
    try {


        var sizeArray = ['75', '100', '125', '150', '200'];
        var thumbnailArray = [];

        var fileStruct = dataObj.Fobj.type.split("/")[0];

        mongodb.MongoClient.connect(connectionstring, function (error, db) {

            if (error) {
                console.log("Mongo connection error " + error);
                callback(error, undefined);
            }
            else {
                var bucket = new mongodb.GridFSBucket(db);
                var ThumbBucket = new mongodb.GridFSBucket(db, {bucketName: 'thumbnails'});
                console.log(dataObj.Fobj.path);
                var uploadReadStream = fs.createReadStream(dataObj.Fobj.path);
                var bucketUploadStream = bucket.openUploadStream(dataObj.rand2);

                if (dataObj.encNeeded) {
                    const cipher = crypto.createCipher(crptoAlgo, crptoPwd);
                    console.log("Encripting");
                    uploadReadStream.pipe(cipher).pipe(bucketUploadStream).on('error', function (error) {
                        // assert.ifError(error);
                        //fs.unlink(path.join(Fobj.path));
                        cipher.end();
                        logger.error('[DVP-FIleService.MongoFileUploader] - [%s]  - Error in Encripted stream uploading to DB ',dataObj.reqId,error);
                        db.close();

                        callback(error, undefined);
                    }).on('finish', function () {
                        logger.info('[DVP-FIleService.MongoFileUploader] - [%s]  - Encripted and uploaded to Mongo successfully ',dataObj.reqId);
                        cipher.end();
                        //RedisPublisher.updateFileStorageRecord(dataObj.Category, dataObj.Fobj.sizeInMB, dataObj.cmp, dataObj.ten);

                        if (fileStruct == "image") {
                            sizeArray.forEach(function (size) {


                                thumbnailArray.push(function createContact(callbackThumb) {


                                    gm(fs.createReadStream(dataObj.Fobj.path)).resize(size, size).quality(50)
                                        .stream(function (err, stdout, stderr) {
                                            var writeStream = ThumbBucket.openUploadStream(dataObj.rand2 + "_" + size);
                                            stdout.pipe(writeStream).on('error', function (error) {
                                                logger.error('[DVP-FIleService.MongoFileUploader] - [%s]  - Error in making thumbnail %s _ %s',dataObj.reqId,dataObj.rand2,size,error);
                                                callbackThumb(error, undefined);
                                            }).on('finish', function (thumb) {

                                                logger.info('[DVP-FIleService.MongoFileUploader] - [%s]  - Successfully created thumbnail %s _ %s',dataObj.reqId,dataObj.rand2,size);
                                                callbackThumb(undefined, "Thumbnails created ");
                                            });
                                        });
                                });
                            });

                            async.series(thumbnailArray, function (errThumbMake, resThumbMake) {
                                console.log(dataObj.Fobj.tempPath);
                                //fs.unlink(path.join(Fobj.tempPath));
                                db.close();
                                callback(undefined, dataObj.rand2);


                            });
                        }
                        else {
                            //fs.unlink(path.join(Fobj.tempPath));
                            db.close();
                            callback(undefined, dataObj.rand2);
                        }


                    });


                }
                else {
                    uploadReadStream.pipe(bucketUploadStream).on('error', function (error) {

                        logger.error('[DVP-FIleService.MongoFileUploader] - [%s]  - Error in file uploading to DB ',dataObj.reqId,error);
                        db.close();
                        callback(error, undefined);
                    }).on('finish', function () {
                        logger.info('[DVP-FIleService.MongoFileUploader] - [%s]  - File uploaded to Mongo successfully ',dataObj.reqId);
                        //RedisPublisher.updateFileStorageRecord(dataObj.Category, dataObj.Fobj.sizeInMB, dataObj.cmp, dataObj.ten);

                        if (fileStruct == "image") {
                            sizeArray.forEach(function (size) {

                                thumbnailArray.push(function createContact(callbackThumb) {

                                    gm(fs.createReadStream(dataObj.Fobj.path)).resize(size, size).quality(50)
                                        .stream(function (err, stdout, stderr) {
                                            var writeStream = ThumbBucket.openUploadStream(dataObj.rand2 + "_" + size);
                                            stdout.pipe(writeStream).on('error', function (error) {
                                                logger.error('[DVP-FIleService.MongoFileUploader] - [%s]  - Error in making thumbnail %s _ %s',dataObj.reqId,dataObj.rand2,size,error);
                                                callbackThumb(error, undefined);
                                            }).on('finish', function () {
                                                logger.info('[DVP-FIleService.MongoFileUploader] - [%s]  - Successfully created thumbnail %s _ %s',dataObj.reqId,dataObj.rand2,size);
                                                callbackThumb(undefined, "Thumbnails created ");
                                            });
                                        });
                                });
                            });

                            async.series(thumbnailArray, function (errThumbMake, resThumbMake) {


                                console.log("End of Thumbnail making");
                                db.close();
                                callback(undefined, dataObj.rand2);


                            });
                        }
                        else {

                            db.close();
                            callback(undefined, dataObj.rand2);
                        }


                    });
                }
            }


        });
    } catch (e) {
        logger.error('[DVP-FIleService.MongoFileUploader] - [%s]  - Error in operation ',dataObj.reqId);
        callback(e,undefined);
    }

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

                } else {

                    callback(undefined,uuid);
                }



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

    try {
        console.log("Uploading to LOCAL");
        var Today = new Date();
        var date = Today.getDate();
        if (date < 10) {
            date = "0" + date;
        }
        var month = Today.getMonth() + 1;
        if (month < 10) {
            month = "0" + month;
        }
        var year = Today.getFullYear();
        var file_category = fileData.Fobj.Category;

        /* var newDir = path.join(config.BasePath, "Company_" + fileData.cmp.toString() + "_Tenant_" + fileData.ten.toString(), file_category, year.toString() + "-" + month.toString() + "-" + date.toString());
         var thumbDir = path.join(config.BasePath, "Company_" + fileData.cmp.toString() + "_Tenant_" + fileData.ten.toString(), file_category + "_thumb", year.toString() + "-" + month.toString() + "-" + date.toString());*/

        var newDir = path.join(uploadPath, "Company_" + fileData.cmp.toString() + "_Tenant_" + fileData.ten.toString(), file_category, year.toString() + "-" + month.toString() + "-" + date.toString());
        var thumbDir = path.join(uploadPath, "Company_" + fileData.cmp.toString() + "_Tenant_" + fileData.ten.toString(), file_category + "_thumb", year.toString() + "-" + month.toString() + "-" + date.toString());


        fileData.Fobj.thumbDir = thumbDir;

        console.log("Uploading Directory "+newDir);
        console.log("Thumbnail Uploading Directory "+thumbDir);


        mkdirp(newDir, function (err) {

            if (err) {
                logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Failed to lode specific location to save', fileData.reqId);
                callback(err, undefined);
            }
            else {
                console.log("Uploading path : " + path.join(newDir, fileData.rand2.toString()));


                if (fileData.encNeeded) {

                    const cipher = crypto.createCipher(crptoAlgo, crptoPwd);
                    fs.createReadStream(fileData.Fobj.path).pipe(cipher)
                        .pipe(fs.createWriteStream(path.join(newDir, fileData.rand2.toString())))
                        .on('error', function (error) {
                            cipher.end();
                            console.log("Error in piping and encrypting");
                            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Error in piping and encrypting', fileData.reqId);
                            callback(error, undefined);

                        }).on('finish', function () {
                        console.log("File  encrypted and stored");
                        cipher.end();
                        fileData.Fobj.path = path.join(newDir, fileData.rand2.toString());
                        fileData.Fobj.thumbDir = thumbDir;
                        logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - File  encrypted and stored', fileData.reqId);
                        callback(undefined, fileData.Fobj);

                    });
                }
                else {
                    fs.createReadStream(fileData.Fobj.path)
                        .pipe(fs.createWriteStream(path.join(newDir, fileData.rand2.toString())))
                        .on('error', function (error) {

                            console.log("Error in piping ");
                            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Error in piping', fileData.reqId);
                            callback(error, undefined);



                        }).on('finish', function () {
                        console.log("File stored");
                        fileData.Fobj.path = path.join(newDir, fileData.rand2.toString());
                        fileData.Fobj.thumbDir = thumbDir;
                        logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - File stored', fileData.reqId);
                        callback(undefined, fileData.Fobj);

                    });
                }

            }

        });
    }
    catch (e) {
        logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [HTTP] - Exception occurred while uploading files to LOCAL', fileData.reqId);
        callback(e, undefined);
    }

}


function localStorageRecordHandler(dataObj, callback)
{
    try {
        localStoreHandler(dataObj, function (errStore, resStore) {

            if (errStore) {
                logger.info('[DVP-FIleService.DeveloperUploadFiles.localStorageRecordHandler] - [%s] - [PGSQL] - Failed to lod specific location to save', dataObj.reqId);
                removeSourceEmptyRecord(dataObj.cmp, dataObj.ten,dataObj.resvID);
                callback(errStore, undefined, dataObj.tempPath);
            }
            else if (resStore) {
                resStore.Source = "LOCAL";
                dataObj.Fobj = resStore;
                RedisPublisher.updateFileStorageRecord(resStore.Category, resStore.sizeInKB, dataObj.cmp, dataObj.ten);
                recordFileDetails(dataObj, function (err, res) {

                    if (err) {
                        callback(err, dataObj.rand2, dataObj.tempPath);
                    }
                    else {
                        console.log("File record added");

                        var thumObj = {
                            uuid:dataObj.rand2,
                            resStore:resStore,
                            Category:dataObj.Category,
                            thumbDir:resStore.thumbDir,
                            reqId:dataObj.reqId,
                            tempPath:dataObj.tempPath,
                            type:dataObj.Fobj.type


                        }

                        /* LocalThumbnailMaker(dataObj.rand2, resStore, dataObj.Category, resStore.thumbDir,dataObj.reqId, function (errThumb, resThumb) {

                         callback(errThumb, dataObj.rand2, dataObj.tempPath);

                         });*/LocalThumbnailMaker(thumObj, function (errThumb, resThumb) {

                            callback(errThumb, dataObj.rand2, dataObj.tempPath);

                        });
                    }

                });
            }
            else {
                removeSourceEmptyRecord(dataObj.cmp, dataObj.ten,dataObj.resvID);
                logger.info('[DVP-FIleService.DeveloperUploadFiles.localStorageRecordHandler] - [%s] - [PGSQL] - Error in operation', dataObj.reqId);
                callback(new Error("Error in operation"), undefined, dataObj.tempPath);
            }

        });
    } catch (e) {
        removeSourceEmptyRecord(dataObj.cmp, dataObj.ten,dataObj.resvID);
        logger.info('[DVP-FIleService.DeveloperUploadFiles.localStorageRecordHandler] - [%s] - [HTTP] - Exception occurred', dataObj.reqId);
        callback(e, undefined, dataObj.tempPath);
    }
}

function mongoFileAndRecordHandler(dataObj,callback) {



    try {
        MongoFileUploader(dataObj, function (errMongo, resMongo) {
            if (errMongo) {
                removeSourceEmptyRecord(dataObj.cmp, dataObj.ten,dataObj.resvID);
                callback(errMongo, undefined, dataObj.tempPath);
            }
            else {
                dataObj.Fobj.Source = "MONGO";
                RedisPublisher.updateFileStorageRecord(dataObj.Category, dataObj.Fobj.sizeInKB, dataObj.cmp, dataObj.ten);
                recordFileDetails(dataObj, function (err, res) {
                    if (err) {
                        callback(err, undefined, dataObj.tempPath);

                    }
                    else {
                        if (res) {
                            callback(undefined, res, dataObj.tempPath);
                        }
                        else {
                            callback(new Error("Error in Operation "), undefined, dataObj.tempPath);
                        }
                    }
                });
            }


        });
    } catch (e) {
        removeSourceEmptyRecord(dataObj.cmp, dataObj.ten,dataObj.resvID);
        callback(e, undefined, dataObj.tempPath);
    }

}

function searchFileCategory(category,company,tenant,reqId,callback) {

    try {
        if (category) {

            console.log("File category : "+category );

            DbConn.FileCategory.findOne({where: [{Category: category},{Company:company},{Tenant:tenant}]}).then(function (resCat) {
                if (resCat) {
                    logger.info('[DVP-FIleService.searchFileCategory] - [%s] - [PGSQL] - File Category found : %s', reqId,category);
                    callback(undefined, resCat);
                }
                else {
                    logger.error('[DVP-FIleService.searchFileCategory] - [%s] - [PGSQL] - Error in searching file Category : %s', reqId,category);
                    callback(new Error("No file category record found "), undefined);
                }
            }).catch(function (errCat) {
                logger.error('[DVP-FIleService.searchFileCategory] - [%s] - [PGSQL] - Error in searching file Category : %s', reqId,category);
                callback(errCat, undefined);
            });
        }
        else {
            logger.error('[DVP-FIleService.searchFileCategory] - [%s] - [HTTP] - No category found',reqId);
            callback(new Error("No file category found "), undefined);
        }
    } catch (e) {
        logger.error('[DVP-FIleService.searchFileCategory] - [%s] - [HTTP] - Exception occurred',reqId);
        callback(e, undefined);
    }
}

function DeveloperUploadFiles(fileObj,callback)
{

    try
    {
        var DisplayName="";
        fileObj.tempPath="";

        if(fileObj.Fobj)
        {
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

            //fileObj.Fobj.sizeInMB=0;
            fileObj.Fobj.sizeInKB=0;

            if(fileObj.Fobj.size!=0 && fileObj.Fobj.size)
            {
                //fileObj.Fobj.sizeInMB = Math.floor(fileObj.Fobj.size/(1024*1024));
                fileObj.Fobj.sizeInKB = Math.floor(fileObj.Fobj.size/(1024));
            }

            if(fileObj.Fobj.path)
            {
                fileObj.tempPath=fileObj.Fobj.path;
            }

            if(fileObj.resvID)
            {
                fileObj.rand2=fileObj.resvID;
            }


            searchFileCategory(fileObj.Category,fileObj.cmp,fileObj.ten,fileObj.reqId,function (errCat,resCat) {

                if(errCat)
                {
                    logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - Error in checking file categories ',fileObj.reqId);
                    callback(errCat,undefined,fileObj.tempPath);
                }
                else
                {
                    fileObj.encNeeded=resCat.Encripted;

                    var fileStore="LOCAL";

                    if(resCat.Source)
                    {
                        fileStore=resCat.Source;
                    }
                    else
                    {
                        fileStore=fileObj.option.toUpperCase();
                    }


                    checkOrganizationSpaceLimit(fileObj.cmp,fileObj.ten,fileObj.Fobj.sizeInKB,fileObj.Category,function (errCheck,resCheck) {

                        if(errCheck)
                        {
                            callback(errCheck,undefined,fileObj.tempPath);
                        }
                        else
                        {
                            if(fileStore=="MONGO")
                            {
                                logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment on process of uploading to MongoDB',fileObj.reqId);
                                console.log("TO MONGO >>>>>>>>> "+fileObj.rand2);
                                mongoFileAndRecordHandler(fileObj,function (errStore,resStore,tempPath) {
                                    callback(errStore,resStore,tempPath);
                                });
                            }
                            else
                            {
                                logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment on process of uploading to LOCAL',fileObj.reqId);
                                console.log("TO LOCAL >>>>>>>>> "+fileObj.rand2);
                                localStorageRecordHandler(fileObj,function (errStore,resStore,tempPath) {
                                    callback(errStore,resStore,tempPath);
                                });
                            }
                        }

                    });







                }
            });
        }
        else
        {
            logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - No file object found ',fileObj.reqId);
            callback(new Error("No file object found"),undefined,fileObj.tempPath);
        }





    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred when new attachment object saving starting ',fileObj.reqId,ex);
        callback(ex,undefined,fileObj.tempPath);
    }


}

function GetUploadedFileSize(company,tenant,callback)
{

    DbConn.FileUpload.sum('Size',{where:[{CompanyId:company},{TenantId:tenant},{ObjCategory:{$ne:'CONVERSATION'}}]}).then(function (resSum) {
        callback(undefined,resSum);
    }).catch(function (errSum) {
        callback(errSum,undefined);
    })




}


function GetOrganozationStorageSizes(company,tenant,callback) {

    RedisPublisher.GetOrganizationSpaceDetails(company,tenant,function (errLim,resLim) {
        callback(errLim,resLim);
    })

}


function removeSourceEmptyRecord (company,tenant,recId)
{
    DbConn.FileCategory.destroy(
        {
            UniqueId: recId,
            CompanyId: company,
            TenantId: tenant

        }).then(function (resCat) {
        if (resCat) {
            logger.info('[DVP-FIleService.removeSourceEmptyRecord] - [%s] - [PGSQL] - File removed : %s', reqId);

        }
        else {
            logger.info('[DVP-FIleService.removeSourceEmptyRecord] - [%s] - [PGSQL] - No such file to remove', reqId);

        }
    }).catch(function (errCat) {
        logger.error('[DVP-FIleService.removeSourceEmptyRecord] - [%s] - [PGSQL] - Error in removing file', reqId);

    });
}

/*function GetUploadedFileSizesWithCategories(company,tenant,callback) {

 var query =
 {
 attributes:['ObjCategory', [DbConn.SequelizeConn.fn('SUM', DbConn.SequelizeConn.col("Size")), 'Sum']],
 where :[{CompanyId: company, TenantId: tenant}],
 group: ['ObjCategory']
 };




 DbConn.FileUpload.findAll(query).then(function (resSum) {
 //callback(undefined,resSum);
 SetRedisStorageRecords(resSum);
 }).catch(function (errSum) {
 callback(errSum,undefined);
 });



 /!* DbConn.FileUpload.sum('Size',{where:[{CompanyId:company},{TenantId:tenant}]},{group:['ObjCategory']}).then(function (resSum) {
 callback(undefined,resSum);
 }).catch(function (errSum) {
 callback(errSum,undefined);
 })*!/
 }

 function SetRedisStorageRecords(sizeObj,company,tenant,callback) {

 if(sizeObj)
 {
 var sizeKeys =[];
 var totalSize=0;
 sizeObj.forEach(function (item) {

 if(item.ObjCategory )
 {
 sizeKeys.push({
 key:tenant+":"+company+":STORAGE:"+item.ObjCategory,
 size:item.Sum
 })
 }

 });

 GetUploadedFileSize(company,tenant,function (errTotal,resTotal) {

 if(errTotal)
 {

 }
 else
 {
 sizeKeys.push({
 key:tenant+":"+company+":STORAGE:TOTAL",
 size:resTotal
 })
 }
 });
 }

 };*/

function DeveloperReserveFiles(Display,fileName,rand2,cmp,ten,Clz,Category,reqId,callback)
{

    try
    {

        FindCurrentVersion( fileName,cmp, ten, reqId,Category, function (errVersion, resVersion) {

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

                            searchFileCategory(Category,cmp,ten,reqId,function (errCat,resCat) {

                                if(errCat)
                                {
                                    callback(errCat, undefined);
                                }
                                else
                                {
                                    resUpFile.setFileCategory(resCat.id).then(function (resCatset) {
                                        logger.info('[DVP-FIleService.DeveloperReserveFiles.setFileCategory] - [%s] - [HTTP] - Attach file category %s to file %s',reqId,resCat.id,rand2);
                                        callback(undefined, resUpFile.UniqueId);

                                    }).catch(function (errCatSet) {
                                        logger.error('[DVP-FIleService.DeveloperReserveFiles.setFileCategory] - [%s] - [HTTP] - Error in attaching file category %s to file %s',reqId,resCat.id,rand2);
                                        callback(errCatSet, undefined);
                                    });
                                }

                            });

                        }
                        else {
                            logger.error('[DVP-FIleService.DeveloperReserveFiles.setFileCategory] - [%s] - [HTTP] - Uploaded file record saving failed',reqId);
                            callback(new Error("Uploaded file record saving failed"), undefined);
                        }


                    }).catch(function (errUpFile) {

                        logger.error('[DVP-FIleService.DeveloperReserveFiles.saveFileRecord] - [%s] - [PGSQL] - Error in saving uploaded file record',reqId,errUpFile);
                        callback(errUpFile, undefined);


                    });

                }
                catch (ex) {
                    logger.error('[DVP-FIleService.DeveloperReserveFiles.saveFileRecord] - [%s] - [PGSQL] - Exception in saving uploaded file record',reqId,ex);
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

    try {
        var result = 0;
        console.log("File saving to " + dataObj.Fobj.path);

        if (dataObj.resvID && dataObj.Fobj) {
            // reserved file and no similar files found
            DbConn.FileUpload.update({
                    Status: "UPLOADED",
                    FileStructure: dataObj.Fobj.type,
                    ObjType: dataObj.Type,
                    URL: dataObj.Fobj.path,
                    RefId: dataObj.ref,
                    Source:dataObj.Fobj.Source
                },
                {
                    where: [{UniqueId: dataObj.resvID}, {Status: "PROCESSING"}]

                }).then(function (resUpdate) {

                logger.info('[DVP-FIleService.recordFileDetails] - [%s] - Uploaded file record Status Set to UPLOADED ', dataObj.reqId);
                callback(undefined, dataObj.resvID);

            }).catch(function (errUpdate) {
                logger.error('[DVP-FIleService.recordFileDetails] - [%s] - Error in Status update of reserved File record  ', dataObj.reqId);
                callback(errUpdate, undefined);
            });


        }
        else {
            // not a reserved file


            FindCurrentVersion(dataObj.Fobj.name, dataObj.cmp, dataObj.ten, dataObj.reqId,dataObj.Category, function (errVersion, resVersion) {
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
                                    Size: dataObj.Fobj.sizeInKB,
                                    Source: dataObj.Fobj.Source


                                }
                            );

                        NewUploadObj.save().then(function (resUpFile) {


                            if (resUpFile) {
                                logger.info('[DVP-FIleService.recordFileDetails] - [%s] - [PGSQL] - New attachment ID %d successfully inserted', dataObj.reqId, dataObj.rand2);
                                searchFileCategory(dataObj.Category,dataObj.cmp,dataObj.ten,dataObj.reqId, function (errCat, resCat) {

                                    if (errCat) {
                                        callback(errCat, undefined);
                                    }
                                    else {
                                        resUpFile.setFileCategory(resCat.id).then(function (resCatset) {

                                            logger.info('[DVP-FIleService.recordFileDetails] - [%s] - [PGSQL] - Attached category id %d to File %s successfully', dataObj.reqId, resCat.id, dataObj.rand2);
                                            callback(undefined, resUpFile.UniqueId);

                                        }).catch(function (errCatSet) {
                                            logger.error('[DVP-FIleService.recordFileDetails] - [%s] - [PGSQL] - Failed to Attach category id %d to File %s successfully', dataObj.reqId, resCat.id, dataObj.rand2);
                                            callback(errCatSet, undefined);
                                        });
                                    }
                                });


                            }
                            else {
                                logger.info('[DVP-FIleService.recordFileDetails] - [%s] - [PGSQL] - New attachment ID %s failed to save', dataObj.reqId, dataObj.rand2);
                                callback(new Error("Upload records saving failed"), undefined);
                            }


                        }).catch(function (errUpFile) {

                            logger.error('[DVP-FIleService.recordFileDetails] - [%s] - [PGSQL] - New attachment ID %s insertion failed / Error', dataObj.reqId, dataObj.rand2);
                            callback(errUpFile, undefined);


                        });

                    }
                    catch (ex) {
                        logger.error('[DVP-FIleService.recordFileDetails] - [%s] - Exception occurred when new attachment object creating ', dataObj.reqId, ex);
                        callback(ex, undefined);
                    }
                }


            });


        }
    } catch (e) {
        logger.error('[DVP-FIleService.recordFileDetails] - [%s] - Exception occurred when method executing ', dataObj.reqId, e);
        callback(e, undefined);
    }
}


function checkOrganizationSpaceLimit(company,tenant,newFileSize,category,callback) {

    if(category !="CONVERSATION")
    {
        RedisPublisher.GetOrganizationsSpaceLimit(company,tenant,function (errKey,resKey) {

            if(errKey)
            {
                console.log('Space Limit checking failed:', err);
                logger.error('[DVP-FIleService.checkOrganizationSpaceLimit]  - Space Limit checking failed ');
                callback(errKey,undefined);
            }
            else
            {
                if(resKey)
                {
                    //var sizeInMB =0;
                    var sizeInKB =0;
                    var orgBody=JSON.parse(resKey);
                    switch(orgBody.spaceUnit)
                    {
                        case "MB" : sizeInKB = orgBody.spaceLimit * 1024;
                            break;

                        case "GB" : sizeInKB = orgBody.spaceLimit * (1024 * 1024);
                            break;

                        case "TB" : sizeInKB= orgBody.spaceLimit * (1024 * 1024 * 1024);
                            break;

                        default :sizeInKB=orgBody.spaceLimit * 1024;


                    }

                    RedisPublisher.getTotalFileStorageDetails(company,tenant,function (errTotal,resTotal) {

                        if(errTotal)
                        {
                            logger.info('[DVP-FIleService.checkOrganizationSpaceLimit]  - Current total space limit searching  failed ');
                            callback(undefined,true);
                        }
                        else
                        {
                            if(resTotal)
                            {
                                var totalSizeWithNewFile = parseInt(resTotal)+parseInt(newFileSize);

                                //if(totalSizeWithNewFile < sizeInMB)
                                if(totalSizeWithNewFile < sizeInKB)
                                {

                                    callback(undefined,true);
                                }
                                else
                                {
                                    logger.info('[DVP-FIleService.checkOrganizationSpaceLimit]  - Allocated Limit Exceeded ');

                                    callback(new Error("Allocated memory size exceeded"),undefined);
                                }
                            }
                            else
                            {
                                logger.error('[DVP-FIleService.checkOrganizationSpaceLimit]  - Current total space limit searching  failed, Uploading Continued ');

                                callback(undefined,true);
                            }

                        }
                    });
                }
                else
                {
                    logger.info('[DVP-FIleService.checkOrganizationSpaceLimit]  - No limitation Info found, Uploading continued ');
                    callback(undefined,true);
                }
            }
        });


        /*var accessToken = util.format("bearer %s", config.Services.accessToken);
         var internalAccessToken = util.format("%d:%d", tenant, company);

         var organizationURL = util.format("http://%s/DVP/API/%s/Organisation/SpaceLimit/%s",config.Services.userServiceHost, config.Services.userServiceVersion,"fileSpace");
         if (validator.isIP(config.Services.userServiceHost)) {
         organizationURL = util.format("http://%s/DVP/API/%s/Organisation/SpaceLimit/%s",config.Services.userServiceHost, config.Services.userServiceVersion,"fileSpace");
         }

         var options = {
         url: organizationURL,
         method: 'GET',
         headers: {

         'authorization': accessToken,
         'companyinfo': internalAccessToken
         }
         };

         try {
         request(options, function optionalCallback(err, httpResponse, body) {
         if (err) {

         }
         else
         {
         if(body && JSON.parse(body).Result[0].SpaceLimit.SpaceLimit && JSON.parse(body).Result[0].SpaceLimit.SpaceUnit)
         {
         var sizeInMB =0;
         var orgBody=JSON.parse(body).Result[0].SpaceLimit;

         switch(orgBody.SpaceUnit)
         {
         case "MB" : sizeInMB = orgBody.SpaceLimit;
         break;

         case "GB" : sizeInMB = orgBody.SpaceLimit * 1024;
         break;

         case "TB" : sizeInMB= orgBody.SpaceLimit * 1024 * 1024;
         break;

         default :sizeInMB=orgBody.SpaceLimit;


         }

         RedisPublisher.getTotalFileStorageDetails(company,tenant,function (errTotal,resTotal) {

         if(errTotal)
         {
         logger.info('[DVP-FIleService.checkOrganizationSpaceLimit]  - Current total space limit searching  failed ');
         callback(undefined,true);
         }
         else
         {
         if(resTotal)
         {
         var totalSizeWithNewFile = parseInt(resTotal)+parseInt(newFileSize);

         if(totalSizeWithNewFile < sizeInMB)
         {

         callback(undefined,true);
         }
         else
         {
         logger.info('[DVP-FIleService.checkOrganizationSpaceLimit]  - Allocated Limit Exceeded ');

         callback(new Error("Allocated memory size exceeded"),undefined);
         }
         }
         else
         {
         logger.error('[DVP-FIleService.checkOrganizationSpaceLimit]  - Current total space limit searching  failed ');

         callback(new Error("Allocated memory size exceeded"),undefined);
         }

         }
         });


         }
         else
         {
         logger.info('[DVP-FIleService.checkOrganizationSpaceLimit]  - No limitation Info found, Uploading continued ');
         callback(undefined,true);
         }
         }


         });
         }catch(ex){
         logger.info('[DVP-FIleService.checkOrganizationSpaceLimit]  - Exception in operation ');
         callback(ex,undefined);
         }*/
    }
    else
    {
        callback(undefined,true);
    }


}





module.exports.DeveloperUploadFiles = DeveloperUploadFiles;
module.exports.FileAssignWithApplication = FileAssignWithApplication;
module.exports.CouchUploader = CouchUploader;
module.exports.DetachFromApplication = DetachFromApplication;
module.exports.DeveloperReserveFiles = DeveloperReserveFiles;
module.exports.LocalThumbnailMaker = LocalThumbnailMaker;
module.exports.localStoreHandler = localStoreHandler;
module.exports.GetUploadedFileSize = GetUploadedFileSize;
module.exports.GetOrganozationStorageSizes = GetOrganozationStorageSizes;
/*module.exports.GetUploadedFileSizesWithCategories = GetUploadedFileSizesWithCategories;*/





