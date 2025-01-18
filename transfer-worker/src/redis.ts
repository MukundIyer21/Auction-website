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

export type messageToPublish = {
  item_id: string;
  user_id: string;
  price: string;
  item_name: string;
};

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

export async function dequeue() {
  const data = await redisClient.lPop(QUEUES.transfer);
  const jsonData: transferQueueElement = data ? JSON.parse(data) : null;
  return jsonData;
}

export async function enqueue(data: transferQueueElement) {
  const stringifiedData = JSON.stringify(data);
  await redisClient.rPush(QUEUES.transfer, stringifiedData);
}

export async function publish(channelName: string, message: messageToPublish) {
  const stringifiedMessage = JSON.stringify(message);
  await redisClient.publish(channelName, stringifiedMessage);
}

export async function addItemToUserList(user_id: string, item_id: string) {
  const key = `transferring_items:${user_id}`;
  await redisClient.rPush(key, item_id);
}

export async function removeItemFromUserList(user_id: string, item_id: string) {
  const key = `transferring_items:${user_id}`;
  await redisClient.lRem(key, 0, item_id);
}

export async function isItemInUserList(user_id: string, item_id: string): Promise<boolean> {
  const key = `transferring_items:${user_id}`;
  const items = await redisClient.lRange(key, 0, -1);
  return items.includes(item_id);
}

export { redisClient };
