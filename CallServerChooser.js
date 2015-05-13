/**
 * Created by pawan on 3/26/2015.
 */
var DbConn = require('DVP-DBModels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var log4js=require('log4js');


var config = require('config');
var hpath=config.Host.hostpath;
var logger = require('DVP-Common/LogHandler.js').logger;


log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("cspicker");

log.info("\n.............................................CallServerPicker Starts....................................................\n");
//log Done...............................................................................................................
function ProfileTypeCallserverChooser(CompId,TenId,reqId,callback)
{
    try {
        logger.info('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [FS] - Values Received - Company %s Tenant %s',reqId,CompId,TenId);
        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {
        DbConn.CloudEndUser.find({where: [{CompanyId:CompId},{TenantId:TenId},{SIPConnectivityProvision:'2'}]}).complete(function (err, CUserObject) {

            if(err)
            {
                logger.error('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching CloudEndUser Company %s Tenant %s Provision 2',reqId,CompId,TenId,err);
                callback(err,undefined);
            }


            else {
                if (CUserObject) {
                    //console.log("................................... Given Cloud End User found ................................ ");
                    //log.info("Record found "+JSON.stringify(CUserObject));
                    logger.info('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Call server found %s',reqId,CUserObject.id);
                    try {
                        //DbConn.FileUpload.find({where: [{UniqueId: rand2}]}).complete(function (err, ScheduleObject) {

                        DbConn.SipNetworkProfile.findAll({where: [{id: CUserObject.SipNetworkProfileId}]}).complete(function (err, CSObject) {

                            if (err) {
                                logger.error('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching SipNetworkProfile -  SipNetworkProfileId %s',reqId,CUserObject.SipNetworkProfileId,err);
                                callback(err, undefined);
                            }
                            else
                            {
                                if (CSObject) {
                                //console.log("................................... Given Call server found ................................  : " + CSObject.CallServerId);
                                //log.info("Record found " + JSON.stringify(CSObject));
                                    logger.debug('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Call server %s found by SipNetworkProfile ',reqId,CSObject.CallServerId);
                                callback(undefined, CSObject.CallServerId);
                                //res.end();
                            }

                            else {
                                // console.log(cloudEndObject);
                                //console.log("................................... empty in  Call server searching ................................  : " + CSObject.CallServerId);
                                    logger.error('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - No SipNetworkProfile record found -  SipNetworkProfileId %s',reqId,CUserObject.SipNetworkProfileId);

                                callback(new Error('No record found for id : ' + CUserObject.SipNetworkProfileId), undefined);
                            }
                        }



                        });
                    }
                    catch (ex) {
                        console.log("Exce " + ex);
                        logger.error('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Exception on searching SipNetworkProfile records ',reqId,ex);
                        // var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
                        //log.fatal("Exception is occurred : "+ex);
                        callback(ex, undefined);
                    }


                    //res.end();
                }


                else {
                    // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                    logger.error('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - No CloudEndUser Found - Company %s Tenant %s Provision 2',reqId,CompId,TenId);
                    callback("No record Found", undefined);
                    // res.end();
                }
            }

        });
    }
    catch (ex) {
        console.log("Exce "+ex);
        logger.error('[DVP-FIleService.FileHandler.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Exception on starting method : ProfileTypeCallserverChooser ',reqId,ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, null);
        callback(ex, undefined);
    }
}

//log Done...............................................................................................................
function InstanceTypeCallserverChooser(CompId,TenId,reqId,callback)
{
    try
    {
        logger.info('[DVP-FIleService.FileHandler.UploadFile.InstanceTypeCallserverChooser] - [%s] - [FS] - Values Received - Company %s Tenant %s',reqId,CompId,TenId);
        DbConn.CallServer.find({where: [{CompanyId:CompId},{TenantId:TenId}]}).complete(function (err, InsObject) {

            if(err)
            {
                logger.error('[DVP-FIleService.FileHandler.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching Call server - Company %s Tenant %s',reqId,CompId,TenId,err);
                callback(err,undefined);
            }
            else
            {
                if (InsObject) {
                    //console.log("................................... Given Call server found ................................  : " + InsObject.id);
                    //log.info("Record found "+JSON.stringify(InsObject));
                    logger.info('[DVP-FIleService.FileHandler.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - Call server found %s',reqId,InsObject.id,err);
                    callback(undefined, InsObject.id);
                    //res.end();
                }
                else {
                    // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                    //log.error("No record found ");
                    logger.error('[DVP-FIleService.FileHandler.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - No call server found',reqId);
                    callback("Error Found", undefined);
                    // res.end();
                }
            }

        });
    }
    catch(ex)
    {
        //log.fatal("Exception is occurred : "+ex);
        //logger.error('[DVP-FIleService.FileHandler.UploadFile] - [%s] - [PGSQL] - No call server found',reqId);
        logger.error('[DVP-FIleService.FileHandler.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - Exception occurred when call server picking' ,reqId,ex);
        callback("Exception Found", undefined);
    }

}
//log done
function SharedTypeCallsereverChooser(CompId,TenId,reqId,callback)
{
    try
    {
        logger.info('[DVP-FIleService.FileHandler.UploadFile.SharedTypeCallsereverChooser] - [%s] - [FS] - Values Received - Company %s Tenant %s',reqId,CompId,TenId);
        DbConn.CloudEndUser
            .findAll({where :[{CompanyId: CompId},{TenantId: TenId},{SIPConnectivityProvision:'3'}], include: [{model: DbConn.Cloud, as: "Cloud", include : [{model: DbConn.CallServer, as: "CallServer"}]}]})
            .complete(function (err, result)
            {
                if(err) {
                    logger.error('[DVP-FIleService.FileHandler.UploadFile.SharedTypeCallsereverChooser] - [%s] - [PGSQL] - Error occurred while searching Cloud end user  - Company %s Tenant %s',reqId,CompId,TenId,err);
                    //log.error("Error in searching ServerID. Error : "+err+" CompanyID : "+CompId+" TenantID : "+TenId);
                    callback(err,undefined);
                }
                else
                {
                    //log.info("Record found "+JSON.stringify(result));
                    logger.info('[DVP-FIleService.FileHandler.UploadFile.SharedTypeCallsereverChooser] - [%s] - [PGSQL] - CloudEndUser found - Result - %s',reqId,result);

                    callback(undefined,result);
                }
            });
    }
    catch(ex)
    {
        //log.error("No record found " + SipNetworkProfileId);
        logger.error('[DVP-FIleService.FileHandler.UploadFile.SharedTypeCallsereverChooser] - [%s] - [PGSQL] - Exception occurred while entering to search CloudEndUser  - Company %s Tenant %s',reqId,CompId,TenId,err);
        callback('Exception',undefined);
    }
}


module.exports.ProfileTypeCallserverChooser = ProfileTypeCallserverChooser;
module.exports.InstanceTypeCallserverChooser = InstanceTypeCallserverChooser;
module.exports.SharedTypeCallsereverChooser = SharedTypeCallsereverChooser;