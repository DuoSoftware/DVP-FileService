/**
 * Created by Pawan on 7/8/2016.
 */

var path = require('path');
var uuid = require('node-uuid');
var DbConn = require('dvp-dbmodels');
var config = require('config');
var streamifier = require('streamifier');
var fs=require('fs');
var gm = require('gm').subClass({imageMagick: true});
var async= require('async');
var util = require('util');

const crypto = require('crypto');
var crptoAlgo = config.Crypto.algo;
var crptoPwd = config.Crypto.password;





//Sprint 5

//var couchbase = require('couchbase');
var Cbucket=config.Couch.bucket;
var CHip=config.Couch.ip;

//var cluster = new couchbase.Cluster("couchbase://"+CHip);
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var RedisPublisher=require('./RedisPublisher.js');

var mongodb= require('mongodb');
var mongoip = config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodbase=config.Mongo.dbname;
var mongopass=config.Mongo.password;
var mongouser=config.Mongo.user;
var mongoreplicaset=config.Mongo.replicaset;


var path= require('path');
var mkdirp = require('mkdirp');

var DeveloperFileUpoladManager=require('./DeveloperFileUpoladManager.js');


var uri = '';
mongoip = mongoip.split(',');

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

function FindCurrentVersion(FObj,company,tenant,reqId,callback)
{
    try
    {
        logger.debug('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - Searching for current version of %s',reqId,FObj.name);
        DbConn.FileUpload.max('Version',{where: [{Filename: FObj.name},{CompanyId:company},{TenantId:tenant}]}).then(function (resFile) {

            if(resFile)
            {
                logger.debug('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - [PGSQL] - Old version of % is found and New version will be %d',reqId,FObj.name,parseInt((resFile)+1));
                callback(undefined,parseInt((resFile)+1));
            }
            else
            {
                logger.debug('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - [PGSQL] -  Version of %s is not found and New version will be 1',reqId,FObj.name);
                callback(undefined,1);
            }

        }).catch(function (errFile) {

            logger.error('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - [PGSQL] - Error occurred while searching for current version of %s',reqId,FObj.name,errFile);
            callback(errFile,undefined);

        });

    }
    catch (ex)
    {
        logger.error('[DVP-FIleService.InternalFileService.FindCurrentVersion] - [%s] - Exception occurred when start searching current version of %s',reqId,FObj.name,ex);
        callback(ex,undefined);
    }
};

function MongoUploader(uuid,Fobj,otherData,encNeeded,reqId,callback)
{

    var sizeArray=['75','100','125','150','200'];
    var thumbnailArray=[];

    var fileStruct=Fobj.type.split("/")[0];

    /*var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;*/
    mongodb.MongoClient.connect(uri, function(error, db)
    {
        console.log(uri);
        console.log("Error1 "+error);
        //console.log("db "+JSON.stringify(db));
        //assert.ifError(error);
        var bucket = new mongodb.GridFSBucket(db);
        var ThumbBucket = new mongodb.GridFSBucket(db,{ bucketName: 'thumbnails' });
        var uploadReadStream = fs.createReadStream(Fobj.path);

        if(encNeeded)
        {
            console.log("Encripting");
            const cipher = crypto.createCipher(crptoAlgo, crptoPwd);
            uploadReadStream.pipe(cipher).pipe(bucket.openUploadStream(uuid)).
                on('error', function(error) {
                    // assert.ifError(error);
                    cipher.end();
                    fs.unlink(path.join(Fobj.path));
                    console.log("Error "+error);
                    db.close();
                    callback(error,undefined);
                }).
                on('finish', function() {
                    console.log('done!');
                    cipher.end();
                    RedisPublisher.updateFileStorageRecord(otherData.fileCategory,Fobj.sizeInMB,otherData.company,otherData.tenant);

                    if(fileStruct=="image")
                    {
                        sizeArray.forEach(function (size) {


                            thumbnailArray.push(function createContact(callbackThumb)
                            {

                                gm(fs.createReadStream(path.join(Fobj.path))).resize(size, size)
                                    .stream(function (err, stdout, stderr) {
                                        var writeStream = ThumbBucket.openUploadStream(uuid + "_"+size);
                                        stdout.pipe(writeStream).on('error', function(error)
                                        {
                                            fs.unlink(path.join(Fobj.path));
                                            console.log("Error in making thumbnail "+uuid + "_"+size);
                                            callbackThumb(error,undefined);
                                        }). on('finish', function()
                                        {
                                            fs.unlink(path.join(Fobj.path));
                                            console.log("Making thumbnail "+uuid + "_"+size+" Success");
                                            callbackThumb(undefined,"Done");
                                        });
                                    });
                            });
                        });

                        async.series(thumbnailArray, function (errThumbMake,resThumbMake) {

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
        }



        uploadReadStream.pipe(bucket.openUploadStream(uuid)).
            on('error', function(error) {
                // assert.ifError(error);
                fs.unlink(path.join(Fobj.path));
                console.log("Error "+error);
                db.close();
                callback(error,undefined);
            }).
            on('finish', function() {
                console.log('done!');

                RedisPublisher.updateFileStorageRecord(otherData.fileCategory,Fobj.sizeInMB,otherData.company,otherData.tenant);

                if(fileStruct=="image")
                {
                    sizeArray.forEach(function (size) {


                        thumbnailArray.push(function createContact(callbackThumb)
                        {

                            gm(fs.createReadStream(path.join(Fobj.path))).resize(size, size)
                                .stream(function (err, stdout, stderr) {
                                    var writeStream = ThumbBucket.openUploadStream(uuid + "_"+size);
                                    stdout.pipe(writeStream).on('error', function(error)
                                    {
                                        fs.unlink(path.join(Fobj.path));
                                        console.log("Error in making thumbnail "+uuid + "_"+size);
                                        callbackThumb(error,undefined);
                                    }). on('finish', function()
                                    {
                                        fs.unlink(path.join(Fobj.path));
                                        console.log("Making thumbnail "+uuid + "_"+size+" Success");
                                        callbackThumb(undefined,"Done");
                                    });
                                });
                        });
                    });

                    async.series(thumbnailArray, function (errThumbMake,resThumbMake) {

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

};

function InternalFileUploadDataRecorder(Fobj,rand2,cmp,ten,result,callback )
{
    console.log("Display name "+Fobj.displayname);
    try

    {


        var NewUploadObj = DbConn.FileUpload
            .build(
            {
                UniqueId: rand2,
                FileStructure: Fobj.fStructure,
                ObjClass: Fobj.fClass,
                ObjType: Fobj.type,
                ObjCategory: Fobj.fCategory,
                URL: Fobj.path,
                UploadTimestamp: Date.now(),
                Filename: Fobj.name,
                Version:result,
                DisplayName: Fobj.displayname,
                CompanyId:cmp,
                TenantId: ten,
                RefId:Fobj.fRefID,
                Size:Fobj.sizeInMB


            }
        );
        //logger.debug('[DVP-FIleService.DeveloperUploadFiles] - [%s] - New attachment object %s',reqId,JSON.stringify(NewUploadObj));
        NewUploadObj.save().then(function (resUpFile) {

            //logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s successfully inserted',reqId,JSON.stringify(NewUploadObj));
            if(resUpFile)
            {
                DbConn.FileCategory.find({where:{Category:Fobj.fCategory}}).then(function (resCat) {

                    if(resCat)
                    {
                        resUpFile.setFileCategory(resCat.id).then(function (resCatset) {

                            callback(undefined,resUpFile.UniqueId);

                        }).catch(function (errCatSet) {
                            callback(errCatSet,undefined);
                        });
                    }
                    else
                    {
                        callback(undefined,resUpFile.UniqueId)
                    }



                }).catch(function (errCat) {
                    callback(errCat,undefined);
                });
            }
            else
            {
                callback(new Error("Upload records saving failed"),undefined);
            }




        }).catch(function (errUpFile) {

            //logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s insertion failed',reqId,JSON.stringify(NewUploadObj),errUpFile);
            callback(errUpFile, undefined);



        });

    }
    catch(ex)
    {
        //logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred when new attachment object creating ',reqId,ex);
        callback(ex,undefined);
    }
}

function DownloadFileByID(res,UUID,display,option,Company,Tenant,reqId,callback)
{

    if(UUID)
    {
        try {

            logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - Searching for Uploaded file %s',reqId,UUID);
            DbConn.FileUpload.find({where: [{UniqueId: UUID},{CompanyId:Company},{TenantId:Tenant}],include:[{model:DbConn.FileCategory , as:"FileCategory"}]}).then(function (resUpFile) {

                if (resUpFile) {

                    if(option.toUpperCase()=="MONGO")
                    {

                        logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [MONGO] - Downloading from Mongo',reqId,JSON.stringify(resUpFile));


                        try {
                            var extArr = resUpFile.FileStructure.split('/');
                            var extension = extArr[1];

                            /*var uri = 'mongodb://' + config.Mongo.user + ':' + config.Mongo.password + '@' + config.Mongo.ip + ':'+config.Mongo.port+'/' + config.Mongo.dbname;*/

                            mongodb.MongoClient.connect(uri, function (error, db) {
                                console.log(uri);
                                console.log("Error1 " + error);
                                if (error) {
                                    res.status(400);
                                    db.close();
                                    res.end();
                                }
                                else {
                                    var bucket = new mongodb.GridFSBucket(db, {
                                        chunkSizeBytes: 1024
                                    });

                                    var source = bucket.openDownloadStreamByName(UUID);

                                    source.pipe(res).
                                        on('error', function (error) {
                                            console.log('Error !' + error);
                                            res.status(400);
                                            db.close();
                                            res.end();

                                        }).
                                        on('finish', function () {
                                            console.log('Downloaded!');
                                            res.status(200);
                                            db.close();
                                            res.end();

                                        });
                                }


                            });
                        } catch (e) {
                            console.log('Exception !' + e);
                            res.status(400);
                            res.end();
                        }



                    }
                    else if(option.toUpperCase()=="COUCH")
                    {
                        logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [MONGO] - Downloading from Couch',reqId,JSON.stringify(resUpFile));

                        var bucket = cluster.openBucket(Cbucket);

                        bucket.get(UUID, function(err, result) {
                            if (err)
                            {
                                console.log(err);

                                callback(err,undefined);
                                res.status(400);
                                res.end();
                            }else
                            {
                                console.log(resUpFile.FileStructure);
                                res.setHeader('Content-Type', resUpFile.FileStructure);

                                var s = streamifier.createReadStream(result.value);
                                s.pipe(res);


                                s.on('end', function (result) {

                                    logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Streaming succeeded',reqId);
                                    SaveDownloadDetails(resUpFile,reqId,function(errSv,resSv)
                                    {
                                        if(errSv)
                                        {
                                            callback(errSv,undefined);
                                        }
                                        else
                                        {
                                            callback(undefined,resSv);
                                        }
                                    });


                                    console.log("ENDED");
                                    res.status(200);
                                    res.end();
                                });
                                s.on('error', function (err) {

                                    logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                    console.log("ERROR");
                                    res.status(400);
                                    res.end();
                                });

                            }


                        });
                    }
                    else
                    {
                        logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [PGSQL] - Record found for File upload %s',reqId,JSON.stringify(resUpFile));
                        try {
                            res.setHeader('Content-Type', resUpFile.FileStructure);
                            /*var SourcePath = (resUpFile.URL.toString()).replace('\',' / '');*/
                            var SourcePath = path.join(resUpFile.URL.toString());
                            console.log(SourcePath);

                            logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',reqId,SourcePath);

                            logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',reqId);

                            var source = fs.createReadStream(SourcePath);
                            source.pipe(res);
                            source.on('end', function (result) {
                                logger.debug('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                res.status(200);
                                res.end();
                            });
                            source.on('error', function (err) {
                                logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                res.status(400);
                                res.end();
                            });
                        }
                        catch(ex)
                        {
                            logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);

                            callback(ex, undefined);
                            res.status(400);
                            res.end();
                        }
                    }

                }

                else {
                    logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [PGSQL] - No record found for  Uploaded file  %s',reqId,UUID);
                    callback(new Error('No record for id : ' + UUID), undefined);
                    res.status(404);
                    res.end();

                }

            }).catch(function (errUpFile) {

                logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [PGSQL] - Error occurred while searching Uploaded file  %s',reqId,UUID,errUpFile);
                callback(errUpFile, undefined);
                res.status(400);
                res.end();

            });



        }
        catch (ex) {
            logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',reqId,UUID);
            callback(new Error("No record Found for the request"), undefined);
            res.status(400);
            res.end();
        }
    }
    else
    {
        logger.error('[DVP-FIleService.InternalFileService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Invalid input for UUID %s',reqId,UUID);
        callback(new Error("Invalid input for UUID"), undefined);
        res.status(404);
        res.end();
    }

};

function DownloadThumbnailByID(res,UUID,option,Company,Tenant,thumbSize,reqId,callback)
{
    if(UUID)
    {
        try {

            var Today= new Date();
            var date= Today.getDate();
            var month=Today.getMonth()+1;
            var year =Today.getFullYear();






            logger.debug('[DVP-FIleService.DownloadFile] - [%s] - Searching for Uploaded file %s',reqId,UUID);
            DbConn.FileUpload.find({where: [{UniqueId: UUID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resUpFile) {

                if (resUpFile) {


                    if(option.toUpperCase()=="MONGO")
                    {

                        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [MONGO] - Downloading from Mongo',reqId,JSON.stringify(resUpFile));


                        try {
                            var extArr = resUpFile.FileStructure.split('/');
                            var extension = extArr[1];

                            /*var uri = 'mongodb://' + config.Mongo.user + ':' + config.Mongo.password + '@' + config.Mongo.ip + ':'+config.Mongo.port+'/' + config.Mongo.dbname;*/

                            mongodb.MongoClient.connect(uri, function (error, db) {
                                console.log(uri);
                                console.log("Error1 " + error);
                                if (error) {
                                    res.status(400);
                                    db.close();
                                    res.end();
                                }
                                else {
                                    var ThumbBucket = new mongodb.GridFSBucket(db, {
                                        chunkSizeBytes: 1024,
                                        bucketName: 'thumbnails'
                                    });
                                    /*  easyimg.thumbnail({
                                     src:bucket.openDownloadStreamByName(UUID), dst:res,
                                     width:128, height:128,
                                     x:0, y:0
                                     }).then(function (image) {
                                     console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
                                     res.status(200);
                                     db.close();
                                     res.end();

                                     },function (err) {
                                     console.log(err);
                                     res.status(400);
                                     db.close();
                                     res.end();
                                     });*/
                                    // var thumbName=UUID + "_"+thumbSize+"X"+thumbSize;



                                    var thumbName=UUID+"_"+thumbSize.toString();
                                    console.log(thumbName);

                                    ThumbBucket.openDownloadStreamByName(thumbName).
                                        pipe(res).
                                        on(
                                        'error',
                                        function(error) {
                                            console.log('Error !'+error);
                                            res.status(400);
                                            db.close();
                                            res.end();

                                        }).
                                        on('finish', function
                                            () {
                                            console.log('done!');
                                            res.status(200);
                                            db.close();
                                            res.end();

                                        });
                                }
                            });
                        } catch (e)
                        {
                            console.log('Exception '+e);
                            res.status(400);
                            db.close();
                            res.end();
                        }



                    }
                    else if(option.toUpperCase()=="COUCH")
                    {
                        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [MONGO] - Downloading from Couch',reqId,JSON.stringify(resUpFile));

                        var bucket = cluster.openBucket(Cbucket);

                        bucket.get(UUID, function(err, result) {
                            if (err)
                            {
                                console.log(err);

                                callback(err,undefined);
                                res.status(400);
                                res.end();
                            }else
                            {
                                console.log(resUpFile.FileStructure);
                                res.setHeader('Content-Type', resUpFile.FileStructure);

                                var s = streamifier.createReadStream(result.value);

                                s.pipe(res);


                                s.on('end', function (result) {

                                    logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Streaming succeeded',reqId);
                                    SaveDownloadDetails(resUpFile,reqId,function(errSv,resSv)
                                    {
                                        if(errSv)
                                        {
                                            callback(errSv,undefined);
                                        }
                                        else
                                        {
                                            callback(undefined,resSv);
                                        }
                                    });


                                    console.log("ENDED");
                                    res.status(200);
                                    res.end();
                                });
                                s.on('error', function (err) {

                                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                    console.log("ERROR");
                                    res.status(400);
                                    res.end();
                                });

                            }


                        });
                    }
                    else
                    {

                        logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Record found for File upload %s',reqId,JSON.stringify(resUpFile));
                        try {

                            res.setHeader('Content-Type', resUpFile.FileStructure);
                            var file_category=resUpFile.ObjCategory;
                            //var SourcePath = (resUpFile.URL.toString()).replace('\',' / '');

                            var SourcePath = path.join(config.BasePath,"Company_"+Company.toString()+"_Tenant_"+Tenant.toString(),file_category+"_thumb",year.toString(),month.toString(),date.toString(),(UUID+"_"+thumbSize).toString());

                            /*var SourcePath=path.parse(resUpFile.URL.toString()).root;
                             pathObj.forEach(function (value,index) {
                             if(index==(pathObj.length-5))
                             {
                             value=value+"_thumb"
                             }
                             if(index==pathObj.length-1)
                             {
                             value=value+"_"+thumbSize;
                             }

                             SourcePath=path.join(SourcePath,value.toString());
                             });
                             //var SourcePath = (SourcePath.toString()).replace('\',' / '');*/
                            console.log(SourcePath);

                            logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',reqId,SourcePath);

                            logger.debug('[DVP-FIleService.DownloadFile] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',reqId);


                            var source = fs.createReadStream(SourcePath.toString());

                            source.pipe(res);
                            source.on('end', function (result) {
                                logger.debug('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                res.status(200);
                                res.end();
                            });
                            source.on('error', function (err) {
                                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                res.status(400);
                                res.end();
                            });
                        }
                        catch(ex)
                        {
                            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);

                            callback(ex, undefined);
                            res.status(400);
                            res.end();
                        }
                    }

                }

                else {
                    logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - No record found for  Uploaded file  %s',reqId,UUID);
                    callback(new Error('No record for id : ' + UUID), undefined);
                    res.status(404);
                    res.end();

                }

            }).catch(function (errUpFile) {

                logger.error('[DVP-FIleService.DownloadFile] - [%s] - [PGSQL] - Error occurred while searching Uploaded file  %s',reqId,UUID,errUpFile);
                callback(errUpFile, undefined);
                res.status(400);
                res.end();

            });



        }
        catch (ex) {
            logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',reqId,UUID);
            callback(new Error("No record Found for the request"), undefined);
            res.status(400);
            res.end();
        }
    }
    else
    {
        logger.error('[DVP-FIleService.DownloadFile] - [%s] - [FILEDOWNLOAD] - Invalid input for UUID %s',reqId,UUID);
        callback(new Error("Invalid input for UUID"), undefined);
        res.status(404);
        res.end();
    }

};

function FileInfoByID(res,UUID,Company,Tenant,reqId)
{
    logger.debug('[DVP-FIleService.InternalFileService.FileInfoByID] - [%s] - Searching for Uploaded file %s',reqId,UUID);
    if(UUID)
    {
        DbConn.FileUpload.find({where: [{UniqueId: UUID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resFile) {

            if(resFile)
            {
                res.header('ETag', resFile.UniqueId);
                res.header('Last-Modified', resFile.updatedAt);
                res.status(200);
                res.end();
            }
            else
            {
                logger.debug('[DVP-FIleService.InternalFileService.FileInfoByID] - [%s] - No such file found for ID %s',reqId,UUID);
                res.status(404);
                res.end();
            }
        }).catch(function (errFile) {
            logger.error('[DVP-FIleService.InternalFileService.FileInfoByID] - [%s] - Error in searching records for ID  %s',reqId,UUID,errFile);
            res.status(400);
            res.end();
        });
    }
    else
    {
        logger.error('[DVP-FIleService.InternalFileService.FileInfoByID] - [%s] - Invalid ID  %s',reqId,UUID);
        res.status(404);
        res.end();
    }

};

function DownloadLatestFileByID(res,FileName,option,Company,Tenant,reqId)
{


    try {

        logger.debug('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - Searching for Uploaded file %s',reqId,FileName);

        DbConn.FileUpload.max('Version',{where: [{Filename: FileName},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resMax) {
            if(resMax)
            {
                logger.debug('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - Max version found for file %s',reqId,FileName);

                DbConn.FileUpload.find({where:[{CompanyId:Company},{TenantId:Tenant},{Filename: FileName},{Version:resMax}],include:[{model:DbConn.FileCategory , as:"FileCategory"}]}).then(function (resUpFile) {

                    if(resUpFile)
                    {

                        var UUID=resUpFile.UniqueId;

                        logger.debug('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - ID found of file %s  ID : %s ',reqId,FileName,UUID);

                        if(option.toUpperCase()=="MONGO")
                        {

                            logger.debug('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - [MONGO] - Downloading from Mongo',reqId,JSON.stringify(resUpFile));

                            var extArr=resUpFile.FileStructure.split('/');
                            var extension=extArr[1];

                            /*var uri = 'mongodb://'+config.Mongo.user+':'+config.Mongo.password+'@'+config.Mongo.ip+':'+config.Mongo.port+'/'+config.Mongo.dbname;*/

                            mongodb.MongoClient.connect(uri, function(error, db)
                            {
                                console.log(uri);
                                console.log("Error1 "+error);
                                if(error)
                                {
                                    logger.error('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - [MONGO] - Error Connecting Mongo cleint ',reqId);
                                    res.status(400);
                                    db.close();
                                    res.end();
                                }
                                else
                                {
                                    var bucket = new mongodb.GridFSBucket(db, {
                                        chunkSizeBytes: 1024
                                    });

                                    var source= bucket.openDownloadStreamByName(UUID);

                                    source.pipe(res).
                                        on('error', function(error) {
                                            console.log('Error !'+error);
                                            res.status(400);
                                            db.close();
                                            res.end();
                                            //callback(error,undefined);
                                        }).
                                        on('finish', function() {
                                            console.log('done!');
                                            res.status(200);
                                            db.close();
                                            res.end();
                                            //process.exit(0);
                                        });
                                }

                            });

                        }
                        else if(option.toUpperCase()=="COUCH")
                        {
                            logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Downloading from Couch',reqId,JSON.stringify(resUpFile));

                            var bucket = cluster.openBucket(Cbucket);
                            bucket.get(UUID, function(err, result) {
                                if (err)
                                {
                                    logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [MONGO] - Couch Error ',reqId,err);
                                    res.status(400);
                                    res.end();
                                }
                                else
                                {
                                    console.log(resUpFile.FileStructure);
                                    res.setHeader('Content-Type', resUpFile.FileStructure);
                                    var s = streamifier.createReadStream(result.value);
                                    s.pipe(res);


                                    s.on('end', function (result) {
                                        logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Streaming succeeded',reqId);
                                        SaveDownloadDetails(resUpFile,reqId,function(errSv,resSv)
                                        {
                                            if(errSv)
                                            {
                                                logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in Recording downloaded file details',reqId,errSv);

                                            }
                                            else
                                            {
                                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Recording downloaded file details succeeded ',reqId);

                                            }
                                        });


                                        console.log("ENDED");
                                        res.status(200);
                                        res.end();
                                    });
                                    s.on('error', function (err) {
                                        logger.error('[DVP-FIleService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in streaming',reqId,err);
                                        console.log("ERROR");
                                        res.status(400);
                                        res.end();
                                    });

                                }


                            });
                        }
                        else
                        {
                            logger.debug('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - [PGSQL] - Record found for File upload %s',reqId,JSON.stringify(resUpFile));
                            try {
                                res.setHeader('Content-Type', resUpFile.FileStructure);
                                var SourcePath = path.join(resUpFile.URL.toString());
                                console.log(SourcePath);
                                logger.debug('[DVP-FIleService.DownloadLatestFileByID] - [%s]  - [FILEDOWNLOAD] - SourcePath of file %s',reqId,SourcePath);

                                logger.debug('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s]  - [FILEDOWNLOAD] - ReadStream is starting',reqId);

                                var source = fs.createReadStream(SourcePath);
                                source.pipe(res);
                                source.on('end', function (result) {
                                    logger.debug('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Piping succeeded',reqId);
                                    res.status(200);
                                    res.end();
                                });
                                source.on('error', function (err) {
                                    logger.error('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Error in Piping',reqId,err);
                                    res.status(400);
                                    res.end();
                                });
                            }
                            catch(ex)
                            {
                                logger.error('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Exception occurred when download section starts',reqId,ex);
                                res.status(400);
                                res.end();
                            }
                        }
                    }
                    else
                    {
                        logger.error('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - No such file found',reqId,FileName);
                        res.status(404);
                        res.end();
                    }

                }).catch(function (errFile) {
                    logger.error('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - Error in file searching',reqId,errFile);
                    res.status(400);
                    res.end();
                });
            }
            else
            {
                logger.error('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - Max not found',reqId);
                res.status(404);
                res.end();
            }
        }).catch(function (errMax) {
            logger.error('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - Error in Max',reqId,errMax);
            res.status(400);
            res.end();
        });

    }
    catch (ex) {
        logger.error('[DVP-FIleService.InternalFileService.DownloadLatestFileByID] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service',reqId,FileName);
        res.status(400);
        res.end();
    }


};

function LatestFileInfoByID(res,FileName,Company,Tenant,reqId)
{
    try {

        logger.debug('[DVP-FIleService.InternalFileService.LatestFileInfoByID] - [%s] - Searching for Uploaded file %s',reqId,FileName);

        DbConn.FileUpload.max('Version',{where: [{Filename: FileName},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resMax) {
            if(resMax)
            {
                DbConn.FileUpload.findOne({where:[{CompanyId:Company},{TenantId:Tenant},{Filename: FileName},{Version:resMax}]}).then(function (resUpFile) {

                    if(resUpFile)
                    {
                        logger.debug('[DVP-FIleService.LatestFileInfoByID] - [%s] - File found FileName %s',reqId,FileName);
                        res.header('ETag', resUpFile.UniqueId);
                        res.header('Last-Modified', resUpFile.updatedAt);
                        res.status(200);
                        res.end();

                    }
                    else
                    {
                        logger.error('[DVP-FIleService.LatestFileInfoByID] - [%s] - File not found FileName %s',reqId,FileName);
                        res.status(404);
                        res.end();
                    }

                }).catch(function (errFile) {
                    logger.error('[DVP-FIleService.LatestFileInfoByID] - [%s] - Error in file searching FileName %s',reqId,FileName,errFile);
                    res.status(400);
                    res.end();
                });
            }
            else
            {
                logger.error('[DVP-FIleService.InternalFileService.LatestFileInfoByID] - [%s] - File not found FileName %s',reqId,FileName);
                res.status(404);
                res.end();
            }
        }).catch(function (errMax) {
            logger.error('[DVP-FIleService.InternalFileService.LatestFileInfoByID] - [%s] - Error in searching Latest File , FileName %s',reqId,FileName,errMax);
            res.status(400);
            res.end();
        });



    }
    catch (ex) {
        logger.error('[DVP-FIleService.InternalFileService.LatestFileInfoByID] - [%s] - [FILEDOWNLOAD] - Exception occurred while starting File download service %s ',reqId,FileName);
        res.status(400);
        res.end();
    }
};

function InternalUploadFiles(Fobj,rand2,cmp,ten,option,BodyObj,reqId,callback)
{

    try
    {

        var encNeeded=false;

        FindCurrentVersion(Fobj,cmp,ten,reqId,function(err,result)
        {
            if(err)
            {
                callback(err,undefined);
            }
            else
            {
                Fobj.sizeInMB=0;
                if(Fobj.size!=0 && Fobj.size)
                {
                    Fobj.sizeInMB = Math.floor(Fobj.size/(1024*1024));
                }
                if(Fobj.path)
                {
                    Fobj.tempPath=Fobj.path;
                }

                DbConn.FileCategory.findOne({where:[{Category:Fobj.fCategory}]}).then(function (resCat) {

                    if (resCat) {
                        encNeeded = resCat.Encripted;
                        if(option.toUpperCase()=="LOCAL")
                        {

                            //callback(undefined, resUpFile.UniqueId);

                            var Today= new Date();
                            var date= Today.getDate();
                            var month=Today.getMonth()+1;
                            var year =Today.getFullYear();

                            var file_category=Fobj.fCategory;

                            var newDir = path.join(config.BasePath,"Company_"+cmp.toString()+"_Tenant_"+ten.toString(),file_category,year.toString(),month.toString(),date.toString());
                            var thumbDir = path.join(config.BasePath,"Company_"+cmp.toString()+"_Tenant_"+ten.toString(),file_category+"_thumb",year.toString(),month.toString(),date.toString());


                            mkdirp(newDir, function(err) {

                                if(err)
                                {
                                    logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Failed to lod specific location to save',reqId);
                                    callback(err,undefined);
                                }
                                else
                                {

                                    const cipher = crypto.createCipher(crptoAlgo, crptoPwd);
                                    if(encNeeded)
                                    {

                                        fs.createReadStream(Fobj.path).pipe(cipher).pipe(fs.createWriteStream(path.join(newDir,rand2.toString()))).on('error', function (error) {

                                            console.log("Error in ecripting and storing file");
                                            cipher.end();
                                            fs.unlink(path.join(Fobj.path));

                                        }).on('finish', function () {
                                            cipher.end();
                                            console.log("File Encrypted and Stored successfully");

                                            Fobj.path=path.join(newDir,rand2.toString());
                                            RedisPublisher.updateFileStorageRecord(file_category,Fobj.sizeInMB,cmp,ten);

                                            InternalFileUploadDataRecorder(Fobj,rand2,cmp,ten,result, function (err,res) {
                                                if(err)
                                                {
                                                    fs.unlink(path.join(Fobj.tempPath));
                                                    callback(err,rand2);
                                                }
                                                else
                                                {
                                                    DeveloperFileUpoladManager.LocalThumbnailMaker(rand2,Fobj,file_category,thumbDir, function (errThumb,resThumb) {
                                                        fs.unlink(path.join(Fobj.tempPath));
                                                        callback(err,rand2);
                                                    });

                                                }

                                            });



                                        });

                                    }
                                    else
                                    {
                                        fs.createReadStream(Fobj.path).pipe(fs.createWriteStream(path.join(newDir,rand2.toString()))).on('error', function (error) {

                                            console.log("Error in storing file");
                                            fs.unlink(path.join(Fobj.path));

                                        }).on('finish', function () {

                                            console.log("File Stored successfully");

                                            Fobj.path=path.join(newDir,rand2.toString());
                                            RedisPublisher.updateFileStorageRecord(file_category,Fobj.sizeInMB,cmp,ten);

                                            InternalFileUploadDataRecorder(Fobj,rand2,cmp,ten,result, function (err,res) {

                                                if(err)
                                                {
                                                    fs.unlink(path.join(Fobj.tempPath));
                                                    callback(err,rand2);
                                                }
                                                else
                                                {
                                                    DeveloperFileUpoladManager.LocalThumbnailMaker(rand2,Fobj,file_category,thumbDir, function (errThumb,resThumb) {

                                                        fs.unlink(path.join(Fobj.tempPath));
                                                        callback(err,rand2);
                                                    });

                                                }

                                            });



                                        });
                                    }


                                }

                            });



                        }
                        else if(option.toUpperCase()=="MONGO")
                        {
                            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s]  - New attachment on process of uploading to MongoDB',reqId);
                            console.log("TO MONGO >>>>>>>>> "+rand2);
                            var otherData =
                            {
                                fileCategory:Fobj.fCategory,
                                company:cmp,
                                tenant:ten
                            }
                            MongoUploader(rand2,Fobj,otherData,encNeeded,reqId,function(errMongo,resMongo)
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
                                    InternalFileUploadDataRecorder(Fobj,rand2,cmp,ten,result, function (err,res) {
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
                        else
                        {
                            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Invalid storage option',reqId);
                            callback(new Error("Invalid storage option"),undefined);
                        }
                    }
                    else{
                        logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - No file category found',reqId);
                        callback(new Error('No file category found'),undefined);
                    }
                }).catch(function (errCat) {
                    logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - Error in searching file category',reqId);
                    callback(errCat,undefined);
                });





            }
        });

    }
    catch(ex)
    {
        logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - Exception occurred when new attachment object saving starting ',reqId,ex);
        callback(ex,undefined);
    }






};


module.exports.DownloadFileByID = DownloadFileByID;
module.exports.FileInfoByID = FileInfoByID;
module.exports.DownloadLatestFileByID = DownloadLatestFileByID;
module.exports.LatestFileInfoByID = LatestFileInfoByID;
module.exports.InternalUploadFiles = InternalUploadFiles;
module.exports.DownloadThumbnailByID = DownloadThumbnailByID;
