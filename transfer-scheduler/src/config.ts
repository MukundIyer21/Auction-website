import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

export const bullmqConfig = {
  redis: redisConfig,
};
