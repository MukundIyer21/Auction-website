import { RedisClientType } from "redis";
import { UserManager } from "./UserManager";
import { pubSubClient as redisClient } from "./redis";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();
  private redisClient: RedisClientType;

  private constructor() {
    this.redisClient = redisClient;
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  public async subscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(userId)?.includes(subscription)) {
      return;
    }

    this.subscriptions.set(userId, (this.subscriptions.get(userId) || []).concat(subscription));
    this.reverseSubscriptions.set(subscription, (this.reverseSubscriptions.get(subscription) || []).concat(userId));
    if (this.reverseSubscriptions.get(subscription)?.length === 1) {
      await this.redisClient.subscribe(subscription, this.redisCallbackHandler);
    }
  }

  private redisCallbackHandler = async (message: string, channel: string) => {
    const parsedMessage = JSON.parse(message);
    this.reverseSubscriptions.get(channel)?.forEach((s) =>
      UserManager.getInstance()
        .getUser(s)
        ?.emit({ ...parsedMessage, type: "BIDUPDATE" })
    );
  };

  public async unsubscribe(userId: string, subscription: string) {
    const subscriptions = this.subscriptions.get(userId);
    if (subscriptions) {
      this.subscriptions.set(
        userId,
        subscriptions.filter((s) => s !== subscription)
      );
    }
    const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
    if (reverseSubscriptions) {
      this.reverseSubscriptions.set(
        subscription,
        reverseSubscriptions.filter((s) => s !== userId)
      );
      if (this.reverseSubscriptions.get(subscription)?.length === 0) {
        this.reverseSubscriptions.delete(subscription);
        await this.redisClient.unsubscribe(subscription);
      }
    }
  }

  public async userLeft(userId: string) {
    console.log(`User with user_id: ${userId} disconnected.`);
    this.subscriptions.get(userId)?.forEach(async (s) => await this.unsubscribe(userId, s));
  }

  getSubscriptions(userId: string) {
    return this.subscriptions.get(userId) || [];
  }
}
