/**
 * Created by pawan on 3/26/2015.
 */
var DbConn = require('DVP-DBModels');
//var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var log4js=require('log4js');


var config = require('config');
var hpath=config.Host.hostpath;
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;


log4js.configure(config.Host.logfilepath, { cwd: hpath });
var log = log4js.getLogger("cspicker");

function ProfileTypeCallserverChooser(CompId,TenId,reqId,callback)
{
    try {
        logger.info('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [FS] - Values Received - Company %s Tenant %s',reqId,CompId,TenId);
        DbConn.CloudEndUser.find({where: [{CompanyId:CompId},{TenantId:TenId},{SIPConnectivityProvision:'2'}]}).then(function (resCloudUser) {

            if (resCloudUser) {
                logger.info('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Call server found %s',reqId,resCloudUser.id);
                try {

                    DbConn.SipNetworkProfile.findAll({where: [{id: resCloudUser.SipNetworkProfileId}]}).complete(function (errSipNwProf, resSipNwProf) {

                        if (errSipNwProf) {
                            logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching SipNetworkProfile -  SipNetworkProfileId %s',reqId,resCloudUser.SipNetworkProfileId,errSipNwProf);
                            callback(errSipNwProf, undefined);
                        }
                        else
                        {
                            if (resSipNwProf) {
                                logger.debug('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Call server %s found by SipNetworkProfile ',reqId,resSipNwProf.CallServerId);
                                callback(undefined, resSipNwProf.CallServerId);
                            }

                            else {
                                logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - No SipNetworkProfile record found -  SipNetworkProfileId %s',reqId,resCloudUser.SipNetworkProfileId);

                                callback(new Error('No record found for SipNetworkProfile id : ' + resCloudUser.SipNetworkProfileId), undefined);
                            }
                        }



                    });
                }
                catch (ex) {
                    logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Exception on searching SipNetworkProfile records ',reqId,ex);
                    callback(ex, undefined);
                }


            }


            else {
                logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - No CloudEndUser Found - Company %s Tenant %s Provision 2',reqId,CompId,TenId);
                callback(new Error("No Cloud end user record Found"), undefined);
            }

        }).catch(function (errCloudUser) {
            logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching CloudEndUser Company %s Tenant %s Provision 2',reqId,CompId,TenId,errCloudUser);
            callback(errCloudUser,undefined);
        });
            
            /*complete(function (errCloudUser, resCloudUser) {

            if(errCloudUser)
            {
                logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching CloudEndUser Company %s Tenant %s Provision 2',reqId,CompId,TenId,errCloudUser);
                callback(errCloudUser,undefined);
            }


            else {
                if (resCloudUser) {
                    logger.info('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Call server found %s',reqId,resCloudUser.id);
                    try {

                        DbConn.SipNetworkProfile.findAll({where: [{id: resCloudUser.SipNetworkProfileId}]}).complete(function (errSipNwProf, resSipNwProf) {

                            if (errSipNwProf) {
                                logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching SipNetworkProfile -  SipNetworkProfileId %s',reqId,resCloudUser.SipNetworkProfileId,errSipNwProf);
                                callback(errSipNwProf, undefined);
                            }
                            else
                            {
                                if (resSipNwProf) {
                                    logger.debug('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Call server %s found by SipNetworkProfile ',reqId,resSipNwProf.CallServerId);
                                callback(undefined, resSipNwProf.CallServerId);
                            }

                            else {
                                    logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - No SipNetworkProfile record found -  SipNetworkProfileId %s',reqId,resCloudUser.SipNetworkProfileId);

                                callback(new Error('No record found for SipNetworkProfile id : ' + resCloudUser.SipNetworkProfileId), undefined);
                            }
                        }



                        });
                    }
                    catch (ex) {
                        logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Exception on searching SipNetworkProfile records ',reqId,ex);
                        callback(ex, undefined);
                    }


                }


                else {
                    logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - No CloudEndUser Found - Company %s Tenant %s Provision 2',reqId,CompId,TenId);
                    callback(new Error("No Cloud end user record Found"), undefined);
                }
            }

        });*/
    }
    catch (ex) {
        logger.error('[DVP-FIleService.UploadFile.ProfileTypeCallserverChooser] - [%s] - [PGSQL] - Exception on starting method : ProfileTypeCallserverChooser ',reqId,ex);
        callback(ex, undefined);
    }
}

//log Done...............................................................................................................
function InstanceTypeCallserverChooser(CompId,TenId,reqId,callback)
{
    try
    {
        logger.info('[DVP-FIleService.UploadFile.InstanceTypeCallserverChooser] - [%s] - [FS] - Values Received - Company %s Tenant %s',reqId,CompId,TenId);
        DbConn.CallServer.find({where: [{CompanyId:CompId},{TenantId:TenId}]}).then(function (resCS) {

            if (resCS) {

                logger.info('[DVP-FIleService.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - Call server found %s',reqId,resCS.id);
                callback(undefined, resCS.id);

            }
            else {

                logger.error('[DVP-FIleService.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - No call server found',reqId);
                callback(new Error("No Callserver Found"), undefined);

            }

        }).catch(function (errCS) {
            logger.error('[DVP-FIleService.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching Call server - Company %s Tenant %s',reqId,CompId,TenId,errCS);
            callback(errCS,undefined);
        });

            /*complete(function (err, InsObject) {

            if(err)
            {
                logger.error('[DVP-FIleService.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - Error occurred while searching Call server - Company %s Tenant %s',reqId,CompId,TenId,err);
                callback(err,undefined);
            }
            else
            {
                if (InsObject) {
                    //console.log("................................... Given Call server found ................................  : " + InsObject.id);
                    //log.info("Record found "+JSON.stringify(InsObject));
                    logger.info('[DVP-FIleService.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - Call server found %s',reqId,InsObject.id,err);
                    callback(undefined, InsObject.id);
                    //res.end();
                }
                else {
                    // var jsonString = messageFormatter.FormatMessage(err, "ERROR found", false, null);
                    //log.error("No record found ");
                    logger.error('[DVP-FIleService.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - No call server found',reqId);
                    callback("Error Found", undefined);
                    // res.end();
                }
            }

        });*/
    }
    catch(ex)
    {
        //log.fatal("Exception is occurred : "+ex);
        //logger.error('[DVP-FIleService.UploadFile] - [%s] - [PGSQL] - No call server found',reqId);
        logger.error('[DVP-FIleService.UploadFile.InstanceTypeCallserverChooser] - [%s] - [PGSQL] - Exception occurred when call server picking' ,reqId,ex);
        callback("Exception Found", undefined);
    }

}
//log done
function SharedTypeCallsereverChooser(CompId,TenId,reqId,callback)
{
    try
    {
        logger.info('[DVP-FIleService.UploadFile.SharedTypeCallsereverChooser] - [%s] - [FS] - Values Received - Company %s Tenant %s',reqId,CompId,TenId);
        DbConn.CloudEndUser
            .findAll({where :[{CompanyId: CompId},{TenantId: TenId},{SIPConnectivityProvision:'3'}], include: [{model: DbConn.Cloud, as: "Cloud", include : [{model: DbConn.CallServer, as: "CallServer"}]}]})
            .then(function (resCldUser) {

                logger.info('[DVP-FIleService.UploadFile.SharedTypeCallsereverChooser] - [%s] - [PGSQL] - CloudEndUser found - Result - %s',reqId,resCldUser);

                callback(undefined,resCldUser);

            }).catch(function (errCldUser) {
                logger.error('[DVP-FIleService.UploadFile.SharedTypeCallsereverChooser] - [%s] - [PGSQL] - Error occurred while searching Cloud end user  - Company %s Tenant %s',reqId,CompId,TenId,errCldUser);
                 callback(errCldUser,undefined);
            });

            /*complete(function (err, result)
            {
                if(err) {
                    logger.error('[DVP-FIleService.UploadFile.SharedTypeCallsereverChooser] - [%s] - [PGSQL] - Error occurred while searching Cloud end user  - Company %s Tenant %s',reqId,CompId,TenId,err);

                    callback(err,undefined);
                }
                else
                {

                    logger.info('[DVP-FIleService.UploadFile.SharedTypeCallsereverChooser] - [%s] - [PGSQL] - CloudEndUser found - Result - %s',reqId,result);

                    callback(undefined,result);
                }
            });*/
    }
    catch(ex)
    {

        logger.error('[DVP-FIleService.UploadFile.SharedTypeCallsereverChooser] - [%s] - [PGSQL] - Exception occurred while entering to search CloudEndUser  - Company %s Tenant %s',reqId,CompId,TenId,err);
        callback('Exception',undefined);
    }
}


module.exports.ProfileTypeCallserverChooser = ProfileTypeCallserverChooser;
module.exports.InstanceTypeCallserverChooser = InstanceTypeCallserverChooser;
module.exports.SharedTypeCallsereverChooser = SharedTypeCallsereverChooser;