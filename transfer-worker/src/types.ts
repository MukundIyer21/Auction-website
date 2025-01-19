import mongoose, { Document } from "mongoose";

export type transferQueueElement =
  | {
      type: 1;
      item_name: string;
      item_id: string;
    }
  | {
      type: 2;
      item_name: string;
      item_id: string;
      user_id: string;
      price: string;
      prev_user_id: string;
    }
  | {
      type: 3;
      item_id: string;
      prev_user_id: string;
    }
  | null;

export type messageToPublish = {
  item_id: string;
  user_id: string;
  price: string;
  item_name: string;
};

export type itemDetails = {
  item_id: string;
  item_name: string;
  price: string;
};

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
