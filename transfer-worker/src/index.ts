import { connectToDatabase } from "./db";
import { dequeue } from "./redis";
import TransferWorker from "./worker";

const sleep = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const main = async () => {
  try {
    await connectToDatabase();
    console.log("Transfer Worker started successfully.");
    while (true) {
      const dequeuedData = await dequeue();
      if (dequeuedData) {
        await TransferWorker.getInstance().process(dequeuedData);
      } else {
        await sleep(1);
      }
    }
  } catch (error) {
    console.error("Error in Transfer Worker:", error);
    process.exit(1);
  }
};

main();
