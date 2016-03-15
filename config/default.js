module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"127.0.0.1",
    "Database":"dvpdb"
  },
  "Redis":
  {
    "ip": "127.0.0.1",
    "port": "6379"

  },

  "Host":
  {
    "domain": "0.0.0.0",
    "port": "8081",
    "version":"6.0",
    "hostpath":"./config",
    "logfilepath": ""
  },

  "Option":"LOCAL",


  "Mongo":
  {
    "ip":"127.0.0.1",
    "port":"27017",
    "dbname":"test"
  },

  "Couch":
  {
    "ip":"127.0.0.1",
    "port":"",
    "bucket":"default"
  }
};