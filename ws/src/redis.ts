import { RedisClientType, createClient } from "redis";
import config from "./config";

const main = () => {
  const redisClient: RedisClientType = createClient({ url: config.redis.url });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redisClient
    .connect()
    .then(() => {
      console.log("Connected to Redis server successfully.");
    })
    .catch((err) => {
      console.error("Error connecting to Redis:", err);
    });

  return redisClient;
};

export default main();
