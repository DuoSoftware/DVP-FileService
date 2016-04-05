module.exports = {
    "DB": {
        "Type":"SYS_DATABASE_TYPE",
        "User":"SYS_DATABASE_POSTGRES_USER",
        "Password":"SYS_DATABASE_POSTGRES_PASSWORD",
        "Port":"SYS_SQL_PORT",
        "Host":"SYS_DATABASE_HOST",
        "Database":"SYS_DATABASE_POSTGRES_USER"
    },


    "Redis":
    {
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "password":"SYS_REDIS_PASSWORD"

    },

    "Host":
    {
        "domain": "HOST_NAME",
        "port": "HOST_FILESERVICE_PORT",
        "version": "HOST_VERSION",
        "hostpath":"HOST_PATH",
        "logfilepath": "LOG4JS_CONFIG"
    },

    "Option":"COUCH",

    "Mongo":
    {
        "ip":"MONGO_IP",
        "port":"MONGO_PORT",
        "dbname":"MONGO_DBNAME",
        "password":"MONGO_PASSWORD"
    },

    "Couch":
    {
        "ip":"COUCH_IP",
        "port":"COUCH_PORT",
        "bucket":"COUCH_BUCKET"
    }
};

//NODE_CONFIG_DIR