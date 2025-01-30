import mongoose, { Schema, Document, Model } from "mongoose";
import { mongoConfig } from "./config";
import { Bid, Item } from "./types";
import { invalidateItemDetails } from "./redis";

const bidSchema = new Schema<Bid>({
  bid_price: { type: String, required: true },
  bidder: { type: String, required: true },
  item_id: { type: String, ref: "Item", required: true },
  timestamp: { type: Date, default: Date.now },
});

const itemSchema = new Schema<Item>({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: true },
  category: { type: [String], required: true },
  auction_end: { type: Date, required: true },
  rating: { type: String, enum: ["PENDING", "ONE", "TWO", "THREE", "FOUR", "FIVE"], required: true },
  status: { type: String, enum: ["PENDING", "ACTIVE", "SOLD", "TRANSFERRING", "UNSOLD"], required: true },
});

const BidModel: Model<Bid> = mongoose.model<Bid>("Bid", bidSchema);
const ItemModel: Model<Item> = mongoose.model<Item>("Item", itemSchema);

async function connectToDatabase() {
  try {
    await mongoose.connect(mongoConfig.uri);
    console.log("Connected to MongoDB successfully.");

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
}

async function getLatestBids(itemId: string, noOfBids = 5): Promise<Bid[]> {
  return await BidModel.find({ item_id: itemId }).sort({ timestamp: -1 }).limit(noOfBids).exec();
}

async function updateItemStatusToTransferring(itemId: string) {
  await invalidateItemDetails(itemId);
  await ItemModel.findByIdAndUpdate(itemId, { status: "TRANSFERRING" });
}

async function updateItemStatusToUnsold(itemId: string) {
  await invalidateItemDetails(itemId);
  await ItemModel.findByIdAndUpdate(itemId, { status: "UNSOLD" });
}

async function checkIfItemIsSold(itemId: string): Promise<boolean> {
  const item = await ItemModel.findById(itemId);
  if (item === null) return true;
  return item.status === "SOLD";
}

async function checkIfItemExists(itemId: string) {
  const item = await ItemModel.findById(itemId);
  return item != null;
}

export { checkIfItemExists, checkIfItemIsSold, connectToDatabase, getLatestBids, updateItemStatusToUnsold, updateItemStatusToTransferring, BidModel, ItemModel };
