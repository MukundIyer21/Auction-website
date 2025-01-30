import mongoose, { Date, Document } from "mongoose";

export type transferQueueElement =
  | {
      type: 1;
      item_name: string;
      item_id: string;
      seller: string;
    }
  | {
      type: 2;
      item_name: string;
      item_id: string;
      user_id: string;
      price: string;
      prev_user_id: string;
      seller: string;
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
  seller: string;
};

export type itemDetails = {
  item_id: string;
  item_name: string;
  price: string;
  seller: string;
};

export type transferSchedulerData =
  | {
      type: 2;
      item_name: string;
      item_id: string;
      user_id: string;
      price: string;
      prev_user_id: string;
      seller: string;
      delay: number;
    }
  | {
      type: 3;
      item_id: string;
      prev_user_id: string;
      delay: number;
    };

export interface Bid extends Document {
  bid_price: string;
  bidder: string;
  item_id: string;
  timestamp: Date;
}

export interface Item extends Document {
  _id: string;
  title: string;
  description: string;
  images: [string];
  category: [string];
  auction_end: Date;
  rating: string;
  status: string;
}
