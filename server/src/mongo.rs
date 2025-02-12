use bson::oid::ObjectId;
use bson::DateTime;
use mongodb::{options::ClientOptions, Client, Database};
use mongodm::prelude::*;
use serde::{Deserialize, Serialize};
use std::string::ToString;

#[derive(Debug, Serialize, Deserialize)]
pub enum Rating {
    PENDING,
    ONE,
    TWO,
    THREE,
    FOUR,
    FIVE,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ItemStatus {
    PENDING,
    ACTIVE,
    TRANSFERRING,
    SOLD,
    UNSOLD,
}

impl ToString for ItemStatus {
    fn to_string(&self) -> String {
        match self {
            ItemStatus::PENDING => "PENDING".to_string(),
            ItemStatus::ACTIVE => "ACTIVE".to_string(),
            ItemStatus::TRANSFERRING => "TRANSFERRING".to_string(),
            ItemStatus::SOLD => "SOLD".to_string(),
            ItemStatus::UNSOLD => "UNSOLD".to_string(),
        }
    }
}

impl ToString for Rating {
    fn to_string(&self) -> String {
        match self {
            Rating::PENDING => "PENDING".to_string(),
            Rating::ONE => "ONE".to_string(),
            Rating::TWO => "TWO".to_string(),
            Rating::THREE => "THREE".to_string(),
            Rating::FOUR => "FOUR".to_string(),
            Rating::FIVE => "FIVE".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Item {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub title: String,
    pub description: String,
    pub images: Vec<String>,
    pub category: String,
    pub auction_end: DateTime,
    pub rating: Rating,
    pub status: ItemStatus,
    pub base_price: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Bid {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub item_id: String,
    pub bidder: String,
    pub bid_price: f64,
    pub timestamp: DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum OperationType {
    ADD,
    TRANSFER,
    DELETE,
}

impl ToString for OperationType {
    fn to_string(&self) -> String {
        match self {
            OperationType::ADD => "ADD".to_string(),
            OperationType::DELETE => "DELETE".to_string(),
            OperationType::TRANSFER => "TRANSFER".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum OperationStatus {
    PENDING,
    COMPLETED,
    FAILED,
}

impl ToString for OperationStatus {
    fn to_string(&self) -> String {
        match self {
            OperationStatus::PENDING => "PENDING".to_string(),
            OperationStatus::COMPLETED => "COMPLETED".to_string(),
            OperationStatus::FAILED => "FAILED".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Operation {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub operation_id: String,
    pub r#type: OperationType,
    pub status: OperationStatus,
    pub params: serde_json::Value,
    pub error: Option<String>,
    pub transaction_hash: Option<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Clone)]
pub struct MongoClient {
    db: Database,
}

#[derive(Debug)]
pub enum MongoError {
    ConnectionError(mongodb::error::Error),
    OperationError(mongodb::error::Error),
}

impl MongoClient {
    pub async fn new(mongodb_url: &str, database_name: &str) -> Result<Self, MongoError> {
        let mut client_options = ClientOptions::parse(mongodb_url)
            .await
            .map_err(MongoError::ConnectionError)?;
        client_options.max_pool_size = Some(10);
        client_options.min_pool_size = Some(1);

        client_options.app_name = Some("Auction Server".to_string());
        let client = Client::with_options(client_options).map_err(MongoError::ConnectionError)?;
        let db = client.database(database_name);
        Ok(Self { db })
    }

    pub fn get_db(&self) -> Database {
        self.db.clone()
    }
}
