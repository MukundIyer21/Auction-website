import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";
import redisClient from "./redis";

const subscribeTransferChannel = () => {
  redisClient.subscribe("transfer", (message) => {
    const parsedMessage = JSON.parse(message);
    const user = UserManager.getInstance().getUser(parsedMessage.user_id);
    if (user) {
      console.log(`Sending message ${parsedMessage} to user ${parsedMessage.userId}`);
      user.emit(parsedMessage);
    }
  });
};

const main = () => {
  console.log("Starting server");
  const wss = new WebSocketServer({
    port: 3001,
    verifyClient: (info, done) => {
      const queryParams = new URLSearchParams(info.req.url?.split("?")[1]);
      const userId = queryParams.get("user_id");

      if (!userId) {
        done(false, 401, "Missing user_id in query parameters");
      } else {
        done(true);
      }
    },
  });

  wss.on("connection", (ws, req) => {
    const queryParams = new URLSearchParams(req.url?.split("?")[1]);
    const userId = queryParams.get("user_id") as string;
    console.log(`Client connected with user_id: ${userId}`);

    UserManager.getInstance().addUser(ws, userId);
  });
  subscribeTransferChannel();
  console.log("Web Socket Server Started On 3001");
};

main();
