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
    throw err;
  }
})();

export async function dequeue() {
  try {
    const data = await redisClient.lPop(QUEUES.transfer);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Error dequeuing data:", err);
    throw err;
  }
}

export async function enqueue(data: transferQueueElement) {
  try {
    await redisClient.rPush(QUEUES.transfer, JSON.stringify(data));
  } catch (err) {
    console.error("Error enqueuing data:", err);
    throw err;
  }
}

export async function publish(channelName: string, message: messageToPublish) {
  try {
    await redisClient.publish(channelName, JSON.stringify(message));
  } catch (err) {
    console.error("Error publishing message:", err);
    throw err;
  }
}

export async function addItemToUserList(user_id: string, item: itemDetails) {
  try {
    await redisClient.rPush(`transferring_items:${user_id}`, JSON.stringify(item));
  } catch (err) {
    console.error("Error adding item to user list:", err);
    throw err;
  }
}

export async function removeItemFromUserList(user_id: string, item_id: string) {
  try {
    const key = `transferring_items:${user_id}`;
    const items = await redisClient.lRange(key, 0, -1);
    for (const itemString of items) {
      const item = JSON.parse(itemString);
      if (item.item_id === item_id) {
        await redisClient.lRem(key, 0, itemString);
        break;
      }
    }
  } catch (err) {
    console.error("Error removing item from user list:", err);
    throw err;
  }
}

export async function invalidateItemDetails(itemId: string) {
  try {
    await redisClient.del(`item_details:${itemId}`);
  } catch (err) {
    console.error("Error invalidating item details:", err);
    throw err;
  }
}

export async function removeItemFromSimilarItems(itemId: string) {
  try {
    const key = `similar_items:${itemId}`;
    const similarItems = await redisClient.get(key);
    if (!similarItems) return;

    const similarItemIds = similarItems.split(",");

    for (const similarItemId of similarItemIds) {
      const similarKey = `similar_items:${similarItemId}`;
      try {
        const existingList = await redisClient.get(similarKey);
        if (existingList) {
          const updatedList = existingList
            .split(",")
            .filter((id) => id !== itemId)
            .join(",");
          if (updatedList) {
            await redisClient.set(similarKey, updatedList);
          } else {
            await redisClient.del(similarKey);
          }
        }
      } catch (err) {
        console.error(`Error updating similar items for ${similarItemId}:`, err);
        throw err;
      }
    }

    await redisClient.del(key);
  } catch (err) {
    console.error(`Error removing item from similar items:`, err);
    throw err;
  }
}

export { redisClient };
