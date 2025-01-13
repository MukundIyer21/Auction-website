import { RedisClientType, createClient } from "redis";
import config from "./config";

const main = () => {
  const redisClient: RedisClientType = createClient({ url: config.redis.url });
  redisClient.connect();
  return redisClient;
};

export default main();
