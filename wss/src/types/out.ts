type TransferMessages = {
  type: "TRANSFER";
  user_id: string;
  item_id: string;
  item_name: string;
  price: string;
  seller: string;
};

type BidUpdateMessages = {
  type: "BIDUPDATE";
  price: string;
};

export type OutgoingMessage = TransferMessages | BidUpdateMessages;
