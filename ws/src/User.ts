import { WebSocket } from "ws";
import { OutgoingMessage } from "./types/out";
import { SubscriptionManager } from "./SubscriptionManager";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";
import redisClient from "./redis";

export class User {
  private id: string;
  private ws: WebSocket;
  private redisClient;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.redisClient = redisClient;
    this.addListeners();
  }

  private subscriptions: string[] = [];

  public async subscribe(subscription: string) {
    this.subscriptions.push(subscription);
  }

  public async unsubscribe(subscription: string) {
    this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
  }

  emit(message: OutgoingMessage) {
    this.ws.send(JSON.stringify(message));
  }

  private addListeners() {
    this.ws.on("message", async (message: string) => {
      const parsedMessage: IncomingMessage = JSON.parse(message);
      if (parsedMessage.method === SUBSCRIBE) {
        parsedMessage.params.forEach((s) => SubscriptionManager.getInstance().subscribe(this.id, s));
      }
      if (parsedMessage.method === UNSUBSCRIBE) {
        parsedMessage.params.forEach((s) => SubscriptionManager.getInstance().unsubscribe(this.id, parsedMessage.params[0]));
      }
    });
  }
}
