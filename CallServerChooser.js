/**
 * Created by pawan on 3/26/2015.
 */
var DbConn = require('DVP-DBModels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var log4js=require('log4js');


var config = require('config');
var hpath=config.Host.hostpath;


log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("cspicker");

log.info("\n.............................................CallServerPicker Starts....................................................\n");
//log Done...............................................................................................................
function ProfileTypeCallserverChooser(CompId,TenId,callback)
{
    try {
        log.info("Profile type is selected :- CompanyID : "+CompId+" TenentID : "+TenId);
        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.CloudEndUser.find({where: [{CompanyId:CompId},{TenantId:TenId},{SIPConnectivityProvision:'2'}]}).complete(function (err, CUserObject) {

            if(err)
            {
                log.error("Error in searching SipNetworkProfileId of CloudEndUser. Error : "+err+" CompanyID : "+CompId+" TenantID : "+TenId);
                callback(err,undefined);
            }


            else {
                if (CUserObject) {
                    console.log("................................... Given Cloud End User found ................................ ");
                    log.info("Record found "+JSON.stringify(CUserObject));
                    try {
                        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {

                        DbConn.SipNetworkProfile.findAll({where: [{id: CUserObject.SipNetworkProfileId}]}).complete(function (err, CSObject) {

                            if (err) {
                                log.error("Error in searching CallServerId of SipNetworkProfile. Error : " + err + " SipNetworkProfileId : " + SipNetworkProfileId);
                                callback(err, undefined);
                            }
                            else
                            {
                                if (CSObject) {
                                console.log("................................... Given Call server found ................................  : " + CSObject.CallServerId);
                                log.info("Record found " + JSON.stringify(CSObject));

                                callback(undefined, CSObject.CallServerId);
                                //res.end();
                            }

                            else {
                                // console.log(cloudEndObject);
                                console.log("................................... empty in  Call server searching ................................  : " + CSObject.CallServerId);
                                log.error("No record found " + SipNetworkProfileId);

                                callback(new Error('No record found for id : ' + CUserObject.SipNetworkProfileId), undefined);
                            }
                        }



                        });
                    }
                    catch (ex) {
                        console.log("Exce " + ex);
                        // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
                        log.fatal("Exception is occurred : "+ex);
                        callback(ex, undefined);
                    }


                    //res.end();
                }


                else {
                    // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                    log.error("No record found ");
                    callback("No record Found", undefined);
                    // res.end();
                }
            }

        });
    }
    catch (ex) {
        console.log("Exce "+ex);
        log.fatal("Exception is occurred : "+ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        callback(ex, undefined);
    }
}

//log Done...............................................................................................................
function InstanceTypeCallserverChooser(CompId,TenId,callback)
{
    try
    {
        log.info("Instance type is selected :- CompanyID : "+CompId+" TenentID : "+TenId);
        DbConn.CallServer.find({where: [{CompanyId:CompId},{TenantId:TenId}]}).complete(function (err, InsObject) {

            if(err)
            {
                log.error("Error in searching CallServer of CallServerID. Error : "+err+" CompanyID : "+CompId+" TenantID : "+TenId);
                callback(err,undefined);
            }
            else
            {
                if (InsObject) {
                    console.log("................................... Given Call server found ................................  : " + InsObject.id);
                    log.info("Record found "+JSON.stringify(InsObject));
                    callback(undefined, InsObject.id);
                    //res.end();
                }
                else {
                    // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                    log.error("No record found ");
                    callback("Error Found", undefined);
                    // res.end();
                }
            }

        });
    }
    catch(ex)
    {
        log.fatal("Exception is occurred : "+ex);
        callback("Exception Found", undefined);
    }

}
//log done
function SharedTypeCallsereverChooser(CompId,TenId,callback)
{
    try
    {
        log.info("Shared type is selected :- CompanyID : "+CompId+" TenentID : "+TenId);
        DbConn.CloudEndUser
            .findAll({where :[{CompanyId: CompId},{TenantId: TenId},{SIPConnectivityProvision:'3'}], include: [{model: DbConn.Cloud, as: "Cloud", include : [{model: DbConn.CallServer, as: "CallServer"}]}]})
            .complete(function (err, result)
            {
                if(err) {
                    log.error("Error in searching ServerID. Error : "+err+" CompanyID : "+CompId+" TenantID : "+TenId);
                    callback(err,undefined);
                }
                else
                {
                    log.info("Record found "+JSON.stringify(result));

                    callback(undefined,result);
                }
            });
    }
    catch(ex)
    {
        log.error("No record found " + SipNetworkProfileId);
        callback('Exception',undefined);
    }
}


module.exports.ProfileTypeCallserverChooser = ProfileTypeCallserverChooser;
module.exports.InstanceTypeCallserverChooser = InstanceTypeCallserverChooser;
module.exports.SharedTypeCallsereverChooser = SharedTypeCallsereverChooser;