import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";
import redisClient from "./redis";

const subscribeTransferChannel = () => {
  redisClient
    .subscribe("transfer", (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        const user = UserManager.getInstance().getUser(parsedMessage.user_id);

        if (user) {
          user.emit(parsedMessage);
        } else {
          console.warn(`No user found for user_id: ${parsedMessage.user_id}`);
        }
      } catch (error) {
        console.error("Error processing transfer channel message:", error);
      }
    })
    .catch((err) => {
      console.error("Error subscribing to Redis 'transfer' channel:", err);
    });
};

const main = () => {
  const wss = new WebSocketServer({
    port: 3001,
    verifyClient: (info, done) => {
      try {
        const queryParams = new URLSearchParams(info.req.url?.split("?")[1]);
        const userId = queryParams.get("user_id");

        if (!userId) {
          console.warn("Connection attempt without user_id.");
          done(false, 401, "Missing user_id in query parameters");
        } else {
          done(true);
        }
      } catch (error) {
        console.error("Error during client verification:", error);
        done(false, 500, "Internal Server Error");
      }
    },
  });

  wss.on("connection", (ws, req) => {
    try {
      const queryParams = new URLSearchParams(req.url?.split("?")[1]);
      const userId = queryParams.get("user_id") as string;

      console.log(`User with user_id: ${userId} connected.`);
      UserManager.getInstance().addUser(ws, userId);

      ws.on("error", (err) => {
        console.error(`Error on WebSocket connection for user_id: ${userId}`, err);
      });
    } catch (error) {
      console.error("Error during connection handling:", error);
    }
  });

  subscribeTransferChannel();
  console.log("WebSocket server started on port 3001.");
};

main();
