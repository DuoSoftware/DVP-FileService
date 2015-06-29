/**
 * Created by pawan on 4/9/2015.
 */
var DbConn = require('DVP-DBModels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var fs=require('fs');
var stringify = require('stringify');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;

function FindCurrentVersion(FObj,reqId,callback)
{
    try
    {
        logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - Searching for current version of %s',reqId,FObj.name);
        //DbConn.FileUpload.find({where: [{Filename: FObj.name}]}).complete(function (err, CurFileObject)
        DbConn.FileUpload.max('Version',{where: [{Filename: FObj.name}]}).complete(function (err, CurFileObject)
        {
            if(err)
            {
                logger.error('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] - Error occurred while searching for current version of %s',reqId,FObj.name,err);
                callback(err,undefined);
            }
            else
            {
                if(CurFileObject)
                {
                    logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] - Old version of % is found and New version will be %d',reqId,FObj.name,parseInt((CurFileObject)+1));
                    callback(undefined,parseInt((CurFileObject)+1));
                }
                else{
                    logger.debug('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - [PGSQL] -  Version of % is not found and New version will be %d',reqId,FObj.name,1);
                    callback(undefined,1);
                }

            }
        });
    }
    catch (ex)
    {
        logger.error('[DVP-FIleService.DeveloperUploadFiles.FindCurrentVersion] - [%s] - Exception occurred when start searching current version of %s',reqId,FObj.name,ex);
        callback(ex,undefined);
    }
}

function DeveloperUploadFiles(Fobj,rand2,cmp,ten,ref,reqId,callback)
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
        FindCurrentVersion(Fobj,reqId,function(err,result)
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
                            ObjType: 'Voice app clip',
                            ObjCategory: 'body.ObjCategory',
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
                    NewUploadObj.save().complete(function (errUpFile, resUpFile) {
                        if (errUpFile) {

                            logger.error('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s insertion failed',reqId,JSON.stringify(NewUploadObj),errUpFile);
                            callback(errUpFile, undefined);




                        }
                        else {
                            logger.info('[DVP-FIleService.DeveloperUploadFiles] - [%s] - [PGSQL] - New attachment object %s successfully inserted',reqId,JSON.stringify(NewUploadObj));
                            callback(undefined, NewUploadObj.UniqueId);
                        }


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
            .complete(function (err, FileObj)
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

            });
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


}

function FileAssignWithApplication(fileUID,appID,callback)
{
    try
    {
        DbConn.FileUpload.find({where:[{UniqueId:fileUID}]}).complete(function(errFile,resFile)
        {
            if(errFile)
            {
                callback(errFile,undefined);
            }else
            {
                if(resFile==null)
                {
                    callback(new Error("No file"),callback);
                }
                else
                {
                    DbConn.Application.find({where:[{id:appID}]}).complete(function(errApp,resApp)
                    {
                        if(errApp)
                        {
                            callback(errApp,undefined);

                        }
                        else
                        {
                            if(resApp==null)
                            {
                                callback(new Error("No Application"),undefined);
                            }
                            else
                            {
                                try
                                {
                                    DbConn.FileUpload.findAll({where:[{Filename:resFile.Filename},{CompanyId:resFile.CompanyId},{TenantId:resFile.TenantId}]}).complete(function(errVFileNm,resVFileNm)
                                    {
                                        if(errVFileNm)
                                        {
                                            callback(errVFileNm,undefined);
                                        }
                                        else
                                        {


                                                for (var index in resVFileNm) {
                                                    resVFileNm[index].setApplication(null).complete(function (errNull, resNull) {

                                                    });

                                                }
                                                resFile.setApplication(resApp).complete(function (errMap, resMap) {
                                                    if (errMap) {
                                                        callback(errMap, undefined);
                                                    }
                                                    else {
                                                        callback(undefined,resMap);
                                                    }
                                                });

                                        }
                                    });

                                }
                                catch(ex)
                                {
                                    callback(ex,undefined);
                                }
                            }
                        }
                    });
                }
            }
        });
    }
    catch(ex)
    {
        callback(ex,undefined);
    }
}

module.exports.DeveloperUploadFiles = DeveloperUploadFiles;
module.exports.UploadAssignToApplication = UploadAssignToApplication;
module.exports.DeveloperVoiceRecordsUploading = DeveloperVoiceRecordsUploading;
module.exports.PickAllVoiceRecordingsOfApplication = PickAllVoiceRecordingsOfApplication;
module.exports.PickAllVoiceAppClipsOfApplication = PickAllVoiceAppClipsOfApplication;
module.exports.PickCallRecordById = PickCallRecordById;
module.exports.PickVoiceAppClipById = PickVoiceAppClipById;
module.exports.FileAssignWithApplication = FileAssignWithApplication;
