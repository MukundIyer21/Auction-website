import { createClient } from "redis";
import { redisConfig } from "./config";
import { itemDetails, messageToPublish, transferQueueElement } from "./types";

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

export async function addItemToUserList(user_id: string, item: itemDetails) {
  const key = `transferring_items:${user_id}`;
  const itemString = JSON.stringify(item);
  await redisClient.rPush(key, itemString);
}

export async function removeItemFromUserList(user_id: string, item_id: string) {
  const key = `transferring_items:${user_id}`;
  const items = await redisClient.lRange(key, 0, -1);
  for (const itemString of items) {
    const item = JSON.parse(itemString);
    if (item.item_id === item_id) {
      await redisClient.lRem(key, 0, itemString);
      break;
    }
  }
}

export { redisClient };
