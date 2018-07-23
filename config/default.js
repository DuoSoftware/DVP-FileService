module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"",
    "Password":"",
    "Port":5432,
    "Host":"",
    "Database":""
  },
  "Redis":
  {
    "mode":"sentinel",//instance, cluster, sentinel
    "ip": "",
    "port": 6389,
    "user": "",
    "password": "",
    "sentinels":{
      "hosts": "",
      "port":16389,
      "name":"redis-cluster"
    }

  },


  "Security":
  {

    "ip" : "",
    "port": 6389,
    "user": "",
    "password": "",
    "mode":"sentinel",//instance, cluster, sentinel
    "sentinels":{
      "hosts": "",
      "port":16389,
      "name":"redis-cluster"
    }
  },

  "Host":
  {
    "domain": "127.0.0.1",
    "port": "5648",
    "version":"1.0.0.0",
    "hostpath":"./config",
    "logfilepath": ""
  },

  "Option":"mongo",
  "Collection":"fs.files",


  "Mongo":
  {
    "ip":"",
    "port":"27017",
    "dbname":"",
    "password":"",
    "user":""
  },

  "Couch":
  {
    "ip":"127.0.0.1",
    "port":"",
    "bucket":"default",
    "user":"",
    "password":""

  },
  "Crypto":
  {
    "algo":"aes192",
    "password":"dialog"

  },
  "BasePath":"./upload",

    "Services" : {
        "accessToken":"",
        "userServiceHost": "",
        "userServiceServicePort": "3638",
        "userServiceVersion": "1.0.0.0"
    },
    "UploadSize":"102400"
};
