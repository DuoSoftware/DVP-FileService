/**
 * Created by pawan on 3/26/2015.
 */
var DbConn = require('./DVP-DBModels');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');




function ProfileTypeCallserverChooser(CompId,TenId,callback)
{
    try {
        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.CloudEndUser.find({where: [{CompanyId:CompId},{TenantId:TenId},{SIPConnectivityProvision:'2'}]}).complete(function (err, CUserObject) {

            if(err)
            {
                callback(err,undefined);
            }


            else {
                if (CUserObject) {
                    console.log("................................... Given Cloud End User found ................................ ");
                    try {
                        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
                        DbConn.SipNetworkProfile.findAll({where: [{id: CUserObject.SipNetworkProfileId}]}).complete(function (err, CSObject) {

                            if (err) {
                                callback(err, undefined);
                            }
                            else if (CSObject) {
                                console.log("................................... Given Call server found ................................  : " + CSObject.CallServerId);
                                callback(undefined, CSObject.CallServerId);
                                //res.end();
                            }

                            else if (!err && !CSObject) {
                                // console.log(cloudEndObject);
                                console.log("................................... empty in  Call server searching ................................  : " + CSObject.CallServerId);

                                callback(new Error('No record found for id : ' + CUserObject.SipNetworkProfileId), undefined);
                            }

                            else {
                                // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                                callback(err, undefined);
                                // res.end();
                            }


                        });
                    }
                    catch (ex) {
                        console.log("Exce " + ex);
                        // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
                        callback(ex, undefined);
                    }


                    //res.end();
                }


                else {
                    // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                    callback(err, CUserObject);
                    // res.end();
                }
            }

        });
    }
    catch (ex) {
        console.log("Exce "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        callback(ex, undefined);
    }
}

function InstanceTypeCallserverChooser(CompId,TenId,callback)
{
    try
    {
        DbConn.CallServer.find({where: [{CompanyId:CompId},{TenantId:TenId}]}).complete(function (err, InsObject) {

            if(err)
            {
                callback(err,undefined);
            }
            else
            {
                if (InsObject) {
                    console.log("................................... Given Call server found ................................  : " + InsObject.id);
                    callback(undefined, InsObject.id);
                    //res.end();
                }
                else {
                    // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                    callback("Error Found", undefined);
                    // res.end();
                }
            }

        });
    }
    catch(ex)
    {
        callback("Exception Found", undefined);
    }

}

function SharedTypeCallsereverChooser(CompId,TenId,callback)
{
    try
    {
        DbConn.CloudEndUser
            .findAll({where :[{CompanyId: CompId},{TenantId: TenId},{SIPConnectivityProvision:'3'}], include: [{model: DbConn.Cloud, as: "Cloud", include : [{model: DbConn.CallServer, as: "CallServer"}]}]})
            .complete(function (err, result)
            {
                if(err) {
                    callback(err,undefined);
                }
                else
                {
                    callback(undefined,result);
                }
            });
    }
    catch(ex)
    {
        callback('Exception',undefined);
    }
}


module.exports.ProfileTypeCallserverChooser = ProfileTypeCallserverChooser;
module.exports.InstanceTypeCallserverChooser = InstanceTypeCallserverChooser;
module.exports.SharedTypeCallsereverChooser = SharedTypeCallsereverChooser;