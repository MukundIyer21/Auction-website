import mongoose, { Schema, Document, Model } from "mongoose";
import { mongoConfig } from "./config";

export interface Bid extends Document {
  bid_price: string;
  bidder: string;
  item_id: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface Item extends Document {
  details: object;
  rating: string;
  status: string;
}

const bidSchema = new Schema<Bid>({
  bid_price: { type: String, required: true },
  bidder: { type: String, required: true },
  item_id: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  timestamp: { type: Date, default: Date.now },
});

const itemSchema = new Schema<Item>({
  details: { type: Object, required: true },
  rating: { type: String, enum: ["pending", "1", "2", "3", "4", "5"], required: true },
  status: { type: String, enum: ["pending", "active", "sold", "transferring", "unsold"], required: true },
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
  return await BidModel.find({ item_id: new mongoose.Types.ObjectId(itemId) })
    .sort({ timestamp: -1 })
    .limit(noOfBids)
    .exec();
}

async function updateItemStatusToTransferring(itemId: string) {
  await ItemModel.findByIdAndUpdate(itemId, { status: "transferring" });
}

async function updateItemStatusToUnsold(itemId: string) {
  await ItemModel.findByIdAndUpdate(itemId, { status: "unsold" });
}

async function checkIfItemIsSold(itemId: string): Promise<boolean> {
  const item = await ItemModel.findById(itemId);
  if (item === null) return true;
  return item.status === "sold";
}

export { checkIfItemIsSold, connectToDatabase, getLatestBids, updateItemStatusToUnsold, updateItemStatusToTransferring, BidModel, ItemModel };
