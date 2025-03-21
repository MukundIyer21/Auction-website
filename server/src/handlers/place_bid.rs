use crate::mongo::{Bid, Item, MongoClient};
use crate::redis::RedisClient;
use crate::types::{CurrentBid, MessageToPublish};
use actix_web::{post, web, HttpResponse, Responder};
use bson::{doc, DateTime};
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct PlaceBidRequest {
    item_id: String,
    incrementation: f64,
    bidder: String,
}

#[derive(Serialize)]
pub struct PlaceBidResponse {
    status: String,
    message: String,
}

#[post("/api/v1/place")]
pub async fn place_bid_handler(
    web::Json(payload): web::Json<PlaceBidRequest>,
    mongo_client: web::Data<MongoClient>,
    redis_client: web::Data<RedisClient>,
) -> impl Responder {
    if payload.incrementation <= 0.0 {
        return HttpResponse::BadRequest().json(PlaceBidResponse {
            status: "error".to_string(),
            message: "Invalid incrementation to bid price".to_string(),
        });
    }

    let db = mongo_client.get_db();
    let items_collection = db.collection::<Item>("items");
    let bids_collection = db.collection::<Bid>("bids");
    let bidder_id = payload.bidder;

    let item = match items_collection
        .find_one(doc! {"_id": &payload.item_id}, None)
        .await
    {
        Ok(Some(item)) if item.status.to_string() == "ACTIVE" => item,
        Ok(Some(_)) => {
            return HttpResponse::BadRequest().json(PlaceBidResponse {
                status: "error".to_string(),
                message: "Item is not available for bidding".to_string(),
            });
        }
        Ok(None) => {
            return HttpResponse::NotFound().json(PlaceBidResponse {
                status: "error".to_string(),
                message: "Item not found".to_string(),
            });
        }
        Err(_) => {
            return HttpResponse::InternalServerError().json(PlaceBidResponse {
                status: "error".to_string(),
                message: "Database error".to_string(),
            });
        }
    };

    let is_initial_bid = match bids_collection
        .find_one(doc! {"item_id" : &payload.item_id}, None)
        .await
    {
        Ok(Some(_bid)) => false,
        Ok(None) => true,
        Err(_) => {
            return HttpResponse::InternalServerError().json(PlaceBidResponse {
                status: "error".to_string(),
                message: "Database error".to_string(),
            });
        }
    };

    let bid_price = if is_initial_bid {
        item.base_price
    } else {
        let current_bid: Option<CurrentBid> = match redis_client
            .get_value("current_bid", &payload.item_id)
            .await
        {
            Ok(bid) => bid,
            Err(_) => {
                return HttpResponse::InternalServerError().json(PlaceBidResponse {
                    status: "error".to_string(),
                    message: "Failed to retrieve current bid".to_string(),
                });
            }
        };

        match current_bid {
            Some(bid) => bid.bid_price + payload.incrementation,
            None => {
                return HttpResponse::BadRequest().json(PlaceBidResponse {
                    status: "error".to_string(),
                    message: "Bids not found despite not being initial bid".to_string(),
                })
            }
        }
    };

    let current_bid = CurrentBid {
        bid_price,
        bidder: bidder_id.clone(),
    };

    if let Err(_) = redis_client
        .set_value("current_bid", &payload.item_id, &current_bid, None)
        .await
    {
        return HttpResponse::InternalServerError().json(PlaceBidResponse {
            status: "error".to_string(),
            message: "Failed to store bid in cache".to_string(),
        });
    }

    let bid = Bid {
        id: None,
        item_id: payload.item_id.clone(),
        bidder: bidder_id.clone(),
        bid_price,
        timestamp: DateTime::from_chrono(Utc::now()),
    };

    if let Err(_) = bids_collection.insert_one(bid, None).await {
        return HttpResponse::InternalServerError().json(PlaceBidResponse {
            status: "error".to_string(),
            message: "Failed to record bid".to_string(),
        });
    }
    let bid_price_str = bid_price.to_string();
    let message = MessageToPublish::new(&bid_price_str);

    if let Err(_) = redis_client.publish(message, &payload.item_id).await {
        eprintln!("Failed to publish bid update");
    }

    HttpResponse::Ok().json(PlaceBidResponse {
        status: "success".to_string(),
        message: "Bid placed successfully".to_string(),
    })
}
