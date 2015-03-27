/**
 * Created by pawan on 3/26/2015.
 */
var DbConn = require('./DVP-DBModels');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');




function ProfileTypeCallserverChooser(CompId,TenId,callback)
{
    try {
        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.CloudEndUser.find({where: [{CompanyId:CompId},{TenantId:TenId}]}).complete(function (err, CUserObject) {

            if(err)
            {
                callback(err,undefined);
            }


            else if (CUserObject) {
                console.log("................................... Given Cloud End User found ................................ ");
                try {
                    //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
                    DbConn.SipNetworkProfile.find({where: [{id:CUserObject.SipNetworkProfilesId}]}).complete(function (err, CSObject) {

                        if(err)
                        {
                            callback(err,undefined);
                        }
                        else if (CSObject) {
                            console.log("................................... Given Call server found ................................  : "+CSObject.CSDBCallServerId);
                            callback(undefined, CSObject.id);
                            //res.end();
                        }

                        if (!err && !CSObject) {
                            // console.log(cloudEndObject);
                            console.log("................................... empty in  Call server searching ................................  : "+CSObject.CSDBCallServerId);




                            // var jsonString = messageFormatter.FormatMessage(null, "Record already in DB", true, CSObject.id);
                            callback(new Error('No record found for id : '+CUserObject.SipNetworkProfilesId), undefined);
                        }

                        else {
                           // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                            callback(err, CSObject);
                            // res.end();
                        }


                    });
                }
                catch (ex) {
                    console.log("Exce "+ex);
                   // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
                    callback(ex, undefined);
                }




                //res.end();
            }

           else  if (!err && !CUserObject) {
                // console.log(cloudEndObject);
                callback(new Error('No CloudEndUser found for CompanyId : '+CompId+" & TenentId : "+TenId),undefined);

            }

            else {
               // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                callback(err, CUserObject);
                // res.end();
            }


        });
    }
    catch (ex) {
        console.log("Exce "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        callback(ex, undefined);
    }
}

module.exports.ProfileTypeCallserverChooser = ProfileTypeCallserverChooser;