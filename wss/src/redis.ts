import { RedisClientType, createClient } from "redis";
import config from "./config";

const createRedisClient = (isPubSub: boolean) => {
  const client: RedisClientType = createClient({ url: config.redis.url });

  client.on("error", (err) => {
    !isPubSub ? console.error("Normal Redis Client Error:", err) : console.error("Pub-Sub Redis Client Error:", err);
  });

  client
    .connect()
    .then(() => {
      !isPubSub ? console.log("Connected to Normal Redis server successfully.") : console.log("Connected to Pub-Sub Redis server successfully.");
    })
    .catch((err) => {
      !isPubSub ? console.error("Error connecting to Normal Redis:", err) : console.error("Error connecting to Pub-Sub Redis:", err);
    });

  return client;
};

const redisClient = createRedisClient(false);
const pubSubClient = createRedisClient(true);

export { redisClient, pubSubClient };
