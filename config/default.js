module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"104.236.231.11",
    "Database":"duo"
  },
  "Redis":
  {
    "ip": "45.55.142.207",
    "port": "6389",
    "password":"DuoS123"

  },
  "Security":
  {
    "ip" : "45.55.142.207",
    "port": 6379,
    "user": "duo",
    "password": "DuoS123"
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
    "dbname":"test",
    "password":"DuoS123"
  },

  "Couch":
  {
    "ip":"127.0.0.1",
    "port":"",
    "bucket":"default"
  }
};