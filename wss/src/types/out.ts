type TransferMessages = {
  user_id: string;
  item_id: string;
  item_name: string;
  price: string;
};

type BidUpdateMessages = {
  item_id: string;
  price: string;
};

export type OutgoingMessage = TransferMessages | BidUpdateMessages;
