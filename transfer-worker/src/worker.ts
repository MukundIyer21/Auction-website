import { addJobWithCallback } from "./bull";
import { checkIfItemExists, checkIfItemIsSold, getLatestBids, updateItemStatusToTransferring, updateItemStatusToUnsold } from "./db";
import { addItemToUserList, publish, removeItemFromUserList } from "./redis";
import { transferQueueElement, Bid } from "./types";

class TransferWorker {
  private static instance: TransferWorker;

  public static getInstance() {
    if (!TransferWorker.instance) {
      TransferWorker.instance = new TransferWorker();
    }
    return TransferWorker.instance;
  }

  public async process(dequedElement: transferQueueElement) {
    if (dequedElement?.type == 1) {
      if (!(await checkIfItemExists(dequedElement.item_id))) return;
      await this.handleFirstBid(dequedElement);
    } else if (dequedElement?.type == 2) {
      if (await checkIfItemIsSold(dequedElement.item_id)) return;
      await this.handleReminingBids(dequedElement);
    } else if (dequedElement?.type == 3) {
      if (await checkIfItemIsSold(dequedElement.item_id)) return;
      await this.handleCleanup(dequedElement);
    }
  }

  private async handleCleanup(dequedElement: transferQueueElement) {
    const { item_id, prev_user_id } = dequedElement?.type == 3 ? dequedElement : { item_id: "", prev_user_id: "" };
    await removeItemFromUserList(prev_user_id, item_id);
    await updateItemStatusToUnsold(item_id);
  }

  private async handleReminingBids(dequedElement: transferQueueElement) {
    const { item_id, user_id, price, prev_user_id, item_name } = dequedElement?.type == 2 ? dequedElement : { item_id: "", user_id: "", price: "", prev_user_id: "", item_name: "" };

    await removeItemFromUserList(prev_user_id, item_id);
    await addItemToUserList(user_id, { item_id, price, item_name });
    await publish("transfer", { item_id, user_id, price, item_name });
  }

  private async handleFirstBid(dequedElement: transferQueueElement) {
    const { item_name, item_id } = dequedElement?.type == 1 ? dequedElement : { item_name: "", item_id: "" };
    const latestFiveBids = await getLatestBids(item_id, 5);
    await this.handleDBStatus(latestFiveBids, item_id);
    if (latestFiveBids.length == 0) {
      return;
    }
    await addItemToUserList(latestFiveBids[0].bidder, { item_id, price: latestFiveBids[0].bid_price, item_name });
    await publish("transfer", {
      item_id,
      user_id: latestFiveBids[0].bidder,
      price: latestFiveBids[0].bid_price,
      item_name,
    });
    await this.registerRemainingBids(latestFiveBids, item_id, item_name);
  }

  private async registerRemainingBids(latestFiveBids: Bid[], item_id: string, item_name: string) {
    const FIVE_MINUTES = 5 * 60 * 1000;
    let time_index = 1;
    for (let i = 1; i < Math.min(latestFiveBids.length, 5); i++) {
      await addJobWithCallback(
        {
          type: 2,
          item_id,
          item_name,
          user_id: latestFiveBids[i].bidder,
          price: latestFiveBids[i].bid_price,
          prev_user_id: latestFiveBids[i - 1].bidder,
        },
        FIVE_MINUTES * time_index++
      );
    }
    const lastValidBidIndex = Math.min(latestFiveBids.length, 5) - 1;
    await addJobWithCallback({ type: 3, item_id, prev_user_id: latestFiveBids[lastValidBidIndex].bidder }, FIVE_MINUTES * time_index);
  }

  private async handleDBStatus(latestFiveBids: Bid[], item_id: string) {
    if (latestFiveBids.length == 0) {
      await updateItemStatusToUnsold(item_id);
    } else {
      await updateItemStatusToTransferring(item_id);
    }
  }
}

export default TransferWorker;
