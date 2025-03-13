import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  timeout: 10000,
};

export const bullmqConfig = {
  redis: redisConfig,
};

export const elasticSearchConfig = {
  baseUrl: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  index: "item_search",
};

export const transferSchedulerConfig = {
  base_uri: process.env.TRANSFER_SCHEDULER_BASE_URI || "http://localhost:3003",
};

export const mongoConfig = {
  uri: process.env.MONGO_URI || "mongodb://localhost:27017/auction_db",
};
