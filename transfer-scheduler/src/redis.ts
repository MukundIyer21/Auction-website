import { createClient } from "redis";
import { redisConfig } from "./config";

export type transferQueueElement =
  | {
      type: 1;
      item_name: string;
      item_id: string;
    }
  | {
      type: 2;
      item_name: string;
      item_id: string;
      user_id: string;
      price: string;
      prev_user_id: string;
    }
  | {
      type: 3;
      item_id: string;
      prev_user_id: string;
    }
  | null;

const redisClient = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
});

export const QUEUES = {
  transfer: "transfer",
};

(async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully.");
  } catch (err) {
    console.error("Redis connection error:", err);
  }
})();

export async function enqueue(data: transferQueueElement) {
  const stringifiedData = JSON.stringify(data);
  await redisClient.rPush(QUEUES.transfer, stringifiedData);
}

export { redisClient };
