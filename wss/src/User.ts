import { WebSocket } from "ws";
import { OutgoingMessage } from "./types/out";
import { SubscriptionManager } from "./SubscriptionManager";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";

export class User {
  private id: string;
  private ws: WebSocket;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListeners();
  }

  emit(message: OutgoingMessage) {
    this.ws.send(JSON.stringify(message));
  }

  private addListeners() {
    this.ws.on("message", async (message: string) => {
      const parsedMessage: IncomingMessage = JSON.parse(message);
      if (parsedMessage.method === SUBSCRIBE) {
        parsedMessage.params.forEach(async (s) => await SubscriptionManager.getInstance().subscribe(this.id, s));
      }
      if (parsedMessage.method === UNSUBSCRIBE) {
        parsedMessage.params.forEach(async (s) => await SubscriptionManager.getInstance().unsubscribe(this.id, s));
      }
    });
  }
}
