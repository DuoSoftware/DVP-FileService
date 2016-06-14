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
    "port": "6389",
    "user": "duo",
    "password": "DuoS123"
  },

  "Host":
  {
    "domain": "127.0.0.1",
    "port": "5645",
    "version":"1.0.0.0",
    "hostpath":"./config",
    "logfilepath": ""
  },

  "Option":"MONGO",
  "Collection":"fs.files",


  "Mongo":
  {
    "ip":"45.55.142.207",
    "port":"27017",
    "dbname":"dvpdb",
    "password":"DuoS123",
    "user":"duo"
  },

  "Couch":
  {
    "ip":"127.0.0.1",
    "port":"",
    "bucket":"default",
    "user":"duo",
    "password":"DuoS123"
  }
};