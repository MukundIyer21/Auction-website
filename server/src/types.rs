use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct MessageToPublish<'a> {
    pub price: &'a str,
}

impl<'a> MessageToPublish<'a> {
    pub fn new(price: &'a str) -> Self {
        MessageToPublish { price }
    }
}

#[derive(Serialize)]
pub struct MessageToEnqueue<'a> {
    pub item_id: &'a str,
}

impl<'a> MessageToEnqueue<'a> {
    pub fn new(item_id: &'a str) -> Self {
        MessageToEnqueue { item_id }
    }
}

#[derive(Debug, Clone)]
pub struct BlockchainAPIURI {
    pub uri: String,
}

#[derive(Debug, Clone)]
pub struct TransferSchedulerURI {
    pub uri: String,
}

#[derive(Serialize, Deserialize)]
pub struct CurrentBid {
    pub bid_price: f64,
    pub bidder: String,
}
