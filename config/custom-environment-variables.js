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
        "mode":"SYS_REDIS_MODE",
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "user": "SYS_REDIS_USER",
        "password": "SYS_REDIS_PASSWORD",
        "sentinels":{
            "hosts": "SYS_REDIS_SENTINEL_HOSTS",
            "port":"SYS_REDIS_SENTINEL_PORT",
            "name":"SYS_REDIS_SENTINEL_NAME"
        }

    },

    "Security":
    {

        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "user": "SYS_REDIS_USER",
        "password": "SYS_REDIS_PASSWORD",
        "mode":"SYS_REDIS_MODE",
        "sentinels":{
            "hosts": "SYS_REDIS_SENTINEL_HOSTS",
            "port":"SYS_REDIS_SENTINEL_PORT",
            "name":"SYS_REDIS_SENTINEL_NAME"
        }

    },


    "Host":
    {
        "domain": "HOST_NAME",
        "port": "HOST_FILESERVICE_PORT",
        "version": "HOST_VERSION",
        "hostpath":"HOST_PATH",
        "logfilepath": "LOG4JS_CONFIG"
    },

    "Option":"STORAGE_OPTION",

    "Mongo":
    {
        "ip":"SYS_MONGO_HOST",
        "port":"SYS_MONGO_PORT",
        "dbname":"SYS_MONGO_DB",
        "password":"SYS_MONGO_PASSWORD",
        "user":"SYS_MONGO_USER",
        "replicaset" :"SYS_MONGO_REPLICASETNAME"
    },

    "Couch":
    {
        "ip":"SYS_COUCH_HOST",
        "port":"SYS_COUCH_PORT",
        "bucket":"SYS_COUCH_BUCKET",
        "user":"SYS_COUCH_USER",
        "password":"SYS_COUCH_PASSWORD"
    },
    "Crypto":
    {
        "algo":"CRYPTO_ALGO",
        "password":"CRYPTO_PASSWORD"
    },
    "Services" : {
        "accessToken": "HOST_TOKEN",
        "userServiceHost": "SYS_USERSERVICE_HOST",
        "userServicePort": "SYS_USERSERVICE_PORT",
        "userServiceVersion": "SYS_USERSERVICE_VERSION"
    }
};

//NODE_CONFIG_DIR
