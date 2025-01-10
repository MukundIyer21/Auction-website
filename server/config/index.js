require('dotenv').config();

module.exports = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6380,
    },
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27018/auction_db'
    },
    polygon: {
        rpcUrl: process.env.POLYGON_AMOY_URL,
        privateKey: process.env.PRIVATE_KEY,
        contractAddress: process.env.CONTRACT_ADDRESS,
    }
};