import { WebSocket } from "ws";
import { User } from "./User";
import { SubscriptionManager } from "./SubscriptionManager";
import { RedisClientType } from "redis";
import { redisClient } from "./redis";

type itemDetails = {
  item_id: string;
  item_name: string;
  price: string;
  seller: string;
};

export class UserManager {
  private static instance: UserManager;
  private users: Map<string, User> = new Map();
  private redisClient: RedisClientType;

  private constructor() {
    this.redisClient = redisClient;
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  public addUser(ws: WebSocket, userId: string) {
    const id = userId;
    const user = new User(id, ws);
    this.users.set(id, user);
    this.registerOnClose(ws, id);
    this.pushAllExistingItems(user, id);
    return user;
  }

  private async pushAllExistingItems(user: User, userId: string) {
    const itemsForUser = await this.getAllItemsForUser(userId);
    itemsForUser.map((item) => {
      user.emit({ ...item, user_id: userId });
    });
  }

  private async getAllItemsForUser(userId: string): Promise<itemDetails[]> {
    const key = `transferring_items:${userId}`;
    const items = await this.redisClient.lRange(key, 0, -1);
    return items.map((itemString) => JSON.parse(itemString));
  }

  private registerOnClose(ws: WebSocket, userId: string) {
    ws.on("close", async () => {
      this.users.delete(userId);
      await SubscriptionManager.getInstance().userLeft(userId);
    });
  }

  public getUser(userId: string) {
    return this.users.get(userId);
  }
}
