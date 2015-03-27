/**
 * Created by pawan on 3/26/2015.
 */

var redis=require('redis');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var DbConn = require('./DVP-DBModels');



var client = redis.createClient(6379,"192.168.2.33");
client.on("error", function (err) {
    console.log("Error " + err);
});


function RedisPublish(SID,AID,callback)
{
    try{
        client.publish("CSCOMMAND:"+SID+":profile",AID,function(err,reply)
        {
            if(err)
            {
                callback(err,undefined);
            }
            else
            {
                callback(undefined,reply);
            }
        });
    }
    catch(ex)
    {
        callback(ex,undefined);
    }

}


/*
function TestIt()
{
    try{

        client.hexists('aps','T',function(err,res)
        {
            if(err)
            {
                console.log("error "+err);
            }
            else
            {
                console.log("Res "+res);
            }
        })
    }
    catch (ex)
    {

    }
}
*/
module.exports.RedisPublish = RedisPublish;
//module.exports.TestIt = TestIt;
