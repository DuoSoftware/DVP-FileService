/**
 * Created by pawan on 4/9/2015.
 */
var DbConn = require('DVP-DBModels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var fs=require('fs');
var stringify = require('stringify');

function FindCurrentVersion(FObj,callback)
{
    try
    {

        //DbConn.FileUpload.find({where: [{Filename: FObj.name}]}).complete(function (err, CurFileObject)
        DbConn.FileUpload.max('Version',{where: [{Filename: FObj.name}]}).complete(function (err, CurFileObject)
        {
            if(err)
            {
                callback(err,undefined);
            }
            else
            {
                if(CurFileObject)
                {
                    callback(undefined,parseInt((CurFileObject)+1));
                }
                else{
                    callback(undefined,1);
                }

            }
        });
    }
    catch (ex)
    {
        callback(ex,undefined);
    }
}

function DeveloperUploadFiles(Fobj,rand2,cmp,ten,ref,callback)
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
                    )
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

function UploadAssignToApplication(FObj,callback)
{

    try
    {
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
            .findAll({where: [{Filename: FObj.Filename},{TenantId: FObj.TenantId},{CompanyId: FObj.CompanyId},{ApplicationId: FObj.ApplicationId}]})
            .complete(function (err, FileObj)
            {
                if(err)
                {
                    console.log("Err "+err);
                    callback(err,undefined);
                }
                else
                {
                    if(FileObj)
                    {
                        console.log("Result length "+FileObj.length);

                        try {
                            DbConn.Application.find({where: [{AppName: FObj.AppName}]}).complete(function (errz, AppObj) {

                                if (errz) {
                                    console.log("Err " + errz);
                                    callback(errz, undefined);
                                }
                                else {
                                    if (FileObj.length == 0) {

                                        try
                                        {
                                            DbConn.FileUpload
                                                .find({where: [{Filename: FObj.Filename}, {ObjType: 'Voice app clip'},{TenantId: FObj.TenantId}, {CompanyId: FObj.CompanyId}, {Version: FObj.Version}]})
                                                .complete(function (errFile, ResFile) {
                                                    if (errFile) {
                                                        console.log("Error " + errFile);
                                                        callback(errFile, undefined);
                                                    }
                                                    else {
                                                        try{
                                                            ResFile.setApplication(AppObj).complete(function (errupdt, resupdt) {
                                                                if (errupdt) {
                                                                    console.log("Error " + errupdt);
                                                                    callback(errupdt, undefined);
                                                                }
                                                                else {
                                                                    callback(undefined, "Done");
                                                                }
                                                            });
                                                        }catch(ex)
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
                                    else {
                                        for (var index in FileObj) {
                                            console.log("Result length " + FileObj[index]);
                                            if (FileObj[index].Version == FObj.Version) {
                                                callback("Already up to date", undefined);
                                            }
                                            else {
                                                try
                                                {

                                                    AppObj.setFileUpload(null).complete(function (errRem, resRem) {
                                                        if (errRem) {
                                                            callback(errRem, undefined);
                                                        }
                                                        else {
                                                            console.log(JSON.stringify(FileObj[index]) + " null");
                                                            try{
                                                                DbConn.FileUpload
                                                                    .find({where: [{Filename: FObj.Filename}, {TenantId: FObj.TenantId}, {CompanyId: FObj.CompanyId}, {Version: FObj.Version}]})
                                                                    .complete(function (errFile, ResFile) {
                                                                        if (errFile) {
                                                                            console.log("Error " + errFile);
                                                                            callback(errFile, undefined);
                                                                        }
                                                                        else {
                                                                            try{
                                                                                ResFile.setApplication(AppObj).complete(function (errupdt, resupdt) {
                                                                                    if (errupdt) {
                                                                                        console.log("Error " + errupdt);
                                                                                        callback(errupdt, undefined);
                                                                                    }
                                                                                    else {
                                                                                        callback(undefined, "Done");
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
                                                            catch (ex)
                                                            {
                                                                callback(ex,undefined);
                                                            }
                                                        }

                                                    });
                                                }
                                                catch (ex)
                                                {
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
                            callback(ex,undefined);
                        }



                    }
                    else
                    {callback("err",undefined);}
                }

            });
    }
    catch(ex)
    {
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
                    )
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



module.exports.DeveloperUploadFiles = DeveloperUploadFiles;
module.exports.UploadAssignToApplication = UploadAssignToApplication;
module.exports.DeveloperVoiceRecordsUploading = DeveloperVoiceRecordsUploading;
module.exports.PickAllVoiceRecordingsOfApplication = PickAllVoiceRecordingsOfApplication;
module.exports.PickAllVoiceAppClipsOfApplication = PickAllVoiceAppClipsOfApplication;
module.exports.PickCallRecordById = PickCallRecordById;
module.exports.PickVoiceAppClipById = PickVoiceAppClipById;
